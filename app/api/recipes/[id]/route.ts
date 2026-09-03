import { auth } from "@clerk/nextjs/server"
import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { authenticateApiKey } from "@/lib/api-keys"
import { BrewmarkUnavailableError, GrinderNotFoundError } from "@/lib/brewmark"
import { personalRecipePatchSchema } from "@/lib/domain"
import { jsonError } from "@/lib/http"
import { deletePersonalRecipe, patchPersonalRecipe } from "@/lib/personal-recipes"
import { recipeMutationErrorResponse } from "@/lib/recipe-api-errors"
import { getRecipeById } from "@/lib/recipes"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return jsonError("invalid_recipe_id", "El identificador no es válido.", 400)
  const grinderParam = request.nextUrl.searchParams.get("grinder")
  const grinderId = grinderParam === null ? undefined : Number(grinderParam)
  if (grinderId !== undefined && (!Number.isSafeInteger(grinderId) || grinderId <= 0)) {
    return jsonError("invalid_grinder_id", "El identificador del molino no es válido.", 400)
  }
  try {
    const { userId } = await auth()
    const recipe = await getRecipeById(id, userId, grinderId)
    if (!recipe) return jsonError("recipe_not_found", "Receta no encontrada.", 404)
    return NextResponse.json(recipe)
  } catch (error) {
    if (error instanceof GrinderNotFoundError) return jsonError("grinder_not_found", "Molino no encontrado.", 404)
    if (error instanceof BrewmarkUnavailableError) {
      return jsonError("grind_conversion_unavailable", "No se pudo convertir la molienda.", 503)
    }
    console.error("recipe.get_failed", { id, error })
    return jsonError("recipe_unavailable", "No se pudo cargar la receta.", 503)
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const { userId } = await authenticateApiKey(request)
    const parsed = personalRecipePatchSchema.safeParse(await request.json())
    if (!parsed.success) {
      return jsonError("invalid_recipe", "La receta no es válida.", 400, parsed.error.flatten().fieldErrors)
    }
    await patchPersonalRecipe(id, parsed.data, userId)
    revalidatePath("/recipes")
    revalidatePath(`/recipes/${id}`)
    return NextResponse.json({ id, updated: true })
  } catch (error) {
    return recipeMutationErrorResponse(error, "recipe_api.update_failed", "No se pudo actualizar la receta.")
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const { userId } = await authenticateApiKey(request)
    await deletePersonalRecipe(id, userId)
    revalidatePath("/recipes")
    revalidatePath("/saved")
    revalidatePath(`/recipes/${id}`)
    return new Response(null, { status: 204 })
  } catch (error) {
    return recipeMutationErrorResponse(error, "recipe_api.delete_failed", "No se pudo eliminar la receta.")
  }
}
