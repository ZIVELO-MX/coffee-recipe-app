import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { revalidatePath } from "next/cache"
import { authenticateApiKey, InvalidApiKeyError } from "@/lib/api-keys"
import {
  BrewmarkUnavailableError,
  GrinderNotFoundError,
  InvalidGrindSettingError,
} from "@/lib/brewmark"
import { createRecipe } from "@/lib/create-recipe"
import { personalRecipeInputSchema } from "@/lib/domain"
import { jsonError } from "@/lib/http"
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
    const id = await createRecipe(
      { ...parsed.data, author },
      { createdByClerkUserId: userId },
    )
    revalidatePath("/recipes")
    return NextResponse.json({ id }, { status: 201 })
  } catch (error) {
    if (error instanceof InvalidApiKeyError) {
      const response = jsonError("invalid_api_key", "La API key no es válida.", 401)
      response.headers.set("WWW-Authenticate", "Bearer")
      return response
    }
    if (error instanceof SyntaxError) {
      return jsonError("invalid_json", "El cuerpo debe ser JSON válido.", 400)
    }
    if (error instanceof GrinderNotFoundError || error instanceof InvalidGrindSettingError) {
      return jsonError("invalid_recipe_grind", "La molienda original no es válida para ese molino.", 400)
    }
    if (error instanceof BrewmarkUnavailableError) {
      return jsonError("brewmark_unavailable", "No se pudo validar la molienda con BrewMark.", 503)
    }
    console.error("recipe_api.create_failed", { error })
    return jsonError("recipe_create_unavailable", "No se pudo crear la receta.", 503)
  }
}
