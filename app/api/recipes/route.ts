import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { jsonError } from "@/lib/http"
import { getRecipePage, parseRecipeFilters } from "@/lib/recipes"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    return NextResponse.json(await getRecipePage(parseRecipeFilters(request.nextUrl.searchParams), userId))
  } catch (error) {
    if (error instanceof ZodError) return jsonError("invalid_filters", "Los filtros no son válidos.", 400)
    console.error("recipes.list_failed", error)
    return jsonError("recipes_unavailable", "No se pudieron cargar las recetas.", 503)
  }
}
