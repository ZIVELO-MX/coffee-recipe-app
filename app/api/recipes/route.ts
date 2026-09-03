import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { revalidatePath } from "next/cache"
import { authenticateApiKey } from "@/lib/api-keys"
import { personalRecipeInputSchema } from "@/lib/domain"
import { jsonError } from "@/lib/http"
import { runIdempotentCreation } from "@/lib/idempotency"
import { createPersonalRecipe } from "@/lib/personal-recipes"
import { recipeMutationErrorResponse } from "@/lib/recipe-api-errors"
import { getRecipePage, parseRecipeFilters } from "@/lib/recipes"
import { getViewerDisplayName } from "@/lib/viewer"

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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await authenticateApiKey(request)
    const parsed = personalRecipeInputSchema.safeParse(await request.json())
    if (!parsed.success) {
      return jsonError("invalid_recipe", "La receta no es válida.", 400, parsed.error.flatten().fieldErrors)
    }
    const author = await getViewerDisplayName(userId)
    const result = await runIdempotentCreation({
      request,
      userId,
      scope: "POST:/api/recipes",
      payload: parsed.data,
      resourceCount: 1,
      execute: async ([id]) => ({ id: await createPersonalRecipe(parsed.data, userId, author, { id }) }),
    })
    revalidatePath("/recipes")
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return recipeMutationErrorResponse(error, "recipe_api.create_failed", "No se pudo crear la receta.")
  }
}
