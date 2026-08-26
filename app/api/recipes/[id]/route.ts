import { auth } from "@clerk/nextjs/server"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"
import { jsonError } from "@/lib/http"
import { getRecipeById } from "@/lib/recipes"

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return jsonError("invalid_recipe_id", "El identificador no es válido.", 400)
  try {
    const { userId } = await auth()
    const recipe = await getRecipeById(id, userId)
    if (!recipe) return jsonError("recipe_not_found", "Receta no encontrada.", 404)
    return NextResponse.json(recipe)
  } catch (error) {
    console.error("recipe.get_failed", { id, error })
    return jsonError("recipe_unavailable", "No se pudo cargar la receta.", 503)
  }
}
