import { NextRequest, NextResponse } from "next/server"
import { getRecipeById } from "@/lib/recipes"
import { jsonError } from "@/lib/http"
import { toWatchyRecipe, WatchyRecipeCompatibilityError } from "@/lib/watchy/adapter"

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const recipe = await getRecipeById(id)
    if (!recipe) return jsonError("recipe_not_found", "Receta no encontrada.", 404)
    return NextResponse.json(toWatchyRecipe(recipe))
  } catch (error) {
    if (error instanceof WatchyRecipeCompatibilityError) return jsonError("recipe_not_watchy_compatible", "La receta aún no tiene una línea de tiempo compatible con Watchy.", 422)
    console.error("watchy.recipe_detail_failed", { id, error })
    return jsonError("watchy_recipe_unavailable", "No se pudo cargar la receta para Watchy.", 503)
  }
}
