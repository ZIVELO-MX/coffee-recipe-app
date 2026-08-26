"use server"

import { auth } from "@clerk/nextjs/server"
import { ObjectId } from "mongodb"
import { revalidatePath } from "next/cache"
import { getDatabase } from "@/lib/db"
import {
  temperatureUnitSchema,
  type ActionResult,
  type TemperatureUnit,
  type UserPreferences,
} from "@/lib/domain"

function failure<T>(code: "AUTH_REQUIRED" | "NOT_FOUND" | "INVALID_INPUT" | "DB_UNAVAILABLE", message: string): ActionResult<T> {
  return { ok: false, error: { code, message } }
}

async function authenticatedRecipe(recipeId: string) {
  const { userId } = await auth()
  if (!userId) return { error: "AUTH_REQUIRED" as const }
  if (!ObjectId.isValid(recipeId)) return { error: "INVALID_INPUT" as const }
  const db = await getDatabase()
  const objectId = new ObjectId(recipeId)
  const exists = await db.collection("recipes").findOne({ _id: objectId }, { projection: { _id: 1 } })
  if (!exists) return { error: "NOT_FOUND" as const }
  return { userId, db, objectId }
}

export async function setRecipeSaved(recipeId: string, saved: boolean): Promise<ActionResult<{ saved: boolean }>> {
  try {
    const context = await authenticatedRecipe(recipeId)
    if ("error" in context) {
      if (context.error === "AUTH_REQUIRED") return failure("AUTH_REQUIRED", "Inicia sesión para guardar recetas.")
      if (context.error === "NOT_FOUND") return failure("NOT_FOUND", "La receta ya no existe.")
      return failure("INVALID_INPUT", "La receta no es válida.")
    }
    const filter = { clerk_user_id: context.userId, recipe_id: context.objectId }
    if (saved) {
      await context.db.collection("saved_recipes").updateOne(filter, { $setOnInsert: { ...filter, created_at: new Date() } }, { upsert: true })
    } else {
      await context.db.collection("saved_recipes").deleteOne(filter)
    }
    revalidatePath("/recipes")
    revalidatePath("/saved")
    revalidatePath(`/recipes/${recipeId}`)
    return { ok: true, data: { saved } }
  } catch (error) {
    console.error("saved_recipe.update_failed", { recipeId, error })
    return failure("DB_UNAVAILABLE", "No se pudo actualizar Guardados.")
  }
}

export async function setRecipeLiked(recipeId: string, liked: boolean): Promise<ActionResult<{ liked: boolean; likeCount: number }>> {
  try {
    const context = await authenticatedRecipe(recipeId)
    if ("error" in context) {
      if (context.error === "AUTH_REQUIRED") return failure("AUTH_REQUIRED", "Inicia sesión para dar me gusta.")
      if (context.error === "NOT_FOUND") return failure("NOT_FOUND", "La receta ya no existe.")
      return failure("INVALID_INPUT", "La receta no es válida.")
    }
    const filter = { clerk_user_id: context.userId, recipe_id: context.objectId }
    if (liked) {
      await context.db.collection("likes").updateOne(filter, { $setOnInsert: { ...filter, created_at: new Date() } }, { upsert: true })
    } else {
      await context.db.collection("likes").deleteOne(filter)
    }
    const likeCount = await context.db.collection("likes").countDocuments({ recipe_id: context.objectId })
    revalidatePath("/recipes")
    revalidatePath(`/recipes/${recipeId}`)
    return { ok: true, data: { liked, likeCount } }
  } catch (error) {
    console.error("recipe_like.update_failed", { recipeId, error })
    return failure("DB_UNAVAILABLE", "No se pudo actualizar el me gusta.")
  }
}

export async function updatePreferences(input: UserPreferences): Promise<ActionResult<UserPreferences>> {
  const { userId } = await auth()
  if (!userId) return failure("AUTH_REQUIRED", "Inicia sesión para guardar tus preferencias.")
  const unit = temperatureUnitSchema.safeParse(input.temperature_unit)
  if (!unit.success || !/^[a-z0-9-]+$/.test(input.default_grinder_slug) || !input.default_grinder_name.trim()) {
    return failure("INVALID_INPUT", "Las preferencias no son válidas.")
  }
  const preferences: UserPreferences = {
    temperature_unit: unit.data as TemperatureUnit,
    default_grinder_slug: input.default_grinder_slug,
    default_grinder_name: input.default_grinder_name.trim().slice(0, 120),
  }
  try {
    await (await getDatabase()).collection("user_preferences").updateOne(
      { clerk_user_id: userId },
      {
        $set: { ...preferences, updated_at: new Date() },
        $setOnInsert: { clerk_user_id: userId, created_at: new Date() },
      },
      { upsert: true },
    )
    revalidatePath("/profile")
    revalidatePath("/recipes")
    return { ok: true, data: preferences }
  } catch (error) {
    console.error("preferences.update_failed", { error })
    return failure("DB_UNAVAILABLE", "No se pudieron guardar las preferencias.")
  }
}
