import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getDatabase } from "@/lib/db"
import {
  BrewmarkUnavailableError,
  GrinderNotFoundError,
  InvalidGrindSettingError,
  validateRecipeGrind,
} from "@/lib/brewmark"
import { recipeInputSchema, validateTimeline } from "@/lib/domain"
import { jsonError } from "@/lib/http"
import { requireRecipeAdmin } from "@/lib/admin"

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return jsonError("invalid_recipe_id", "El identificador no es válido.", 400)
  try {
    await requireRecipeAdmin(request)
    const parsed = recipeInputSchema.safeParse(await request.json())
    if (!parsed.success) return jsonError("invalid_recipe", "La receta no es válida.", 400)
    validateTimeline(parsed.data.steps)
    await validateRecipeGrind(parsed.data.grind)
    const result = await (await getDatabase()).collection("recipes").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...parsed.data, updated_at: new Date() } },
    )
    if (!result.matchedCount) return jsonError("recipe_not_found", "Receta no encontrada.", 404)
    revalidatePath("/recipes")
    revalidatePath(`/recipes/${id}`)
    return NextResponse.json({ updated: true })
  } catch (error) {
    if (error instanceof Response) return error
    if (error instanceof GrinderNotFoundError || error instanceof InvalidGrindSettingError) {
      return jsonError("invalid_recipe_grind", "La molienda original no es válida para ese molino.", 400)
    }
    if (error instanceof BrewmarkUnavailableError) {
      return jsonError("brewmark_unavailable", "No se pudo validar la molienda con BrewMark.", 503)
    }
    console.error("admin.recipe_update_failed", { id, error })
    return jsonError("recipe_update_failed", "No se pudo actualizar la receta.", 400)
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return jsonError("invalid_recipe_id", "El identificador no es válido.", 400)
  try {
    await requireRecipeAdmin(request)
    const db = await getDatabase()
    const recipeId = new ObjectId(id)
    const result = await db.collection("recipes").deleteOne({ _id: recipeId })
    if (!result.deletedCount) return jsonError("recipe_not_found", "Receta no encontrada.", 404)
    await Promise.all([
      db.collection("likes").deleteMany({ recipe_id: recipeId }),
      db.collection("saved_recipes").deleteMany({ recipe_id: recipeId }),
    ])
    revalidatePath("/recipes")
    revalidatePath("/saved")
    return new Response(null, { status: 204 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("admin.recipe_delete_failed", { id, error })
    return jsonError("recipe_delete_failed", "No se pudo eliminar la receta.", 400)
  }
}
