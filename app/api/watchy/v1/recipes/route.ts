import { NextRequest, NextResponse } from "next/server"
import { getRecipePage, parseRecipeFilters } from "@/lib/recipes"
import { toWatchyRecipe, WatchyRecipeCompatibilityError } from "@/lib/watchy/adapter"
import { jsonError } from "@/lib/http"

export async function GET(request: NextRequest) {
  try {
    const page = await getRecipePage(parseRecipeFilters(request.nextUrl.searchParams))
    const data = page.data.flatMap((recipe) => {
      try { return [toWatchyRecipe(recipe)] } catch (error) {
        if (error instanceof WatchyRecipeCompatibilityError) return []
        throw error
      }
    })
    return NextResponse.json({ data, total: data.length, page: page.page, pageSize: page.pageSize })
  } catch (error) {
    console.error("watchy.recipes_list_failed", error)
    return jsonError("watchy_recipes_unavailable", "No se pudieron cargar las recetas para Watchy.", 503)
  }
}
