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

export async function POST(request: NextRequest) {
  try {
    await requireRecipeAdmin(request)
    const parsed = recipeInputSchema.safeParse(await request.json())
    if (!parsed.success) return jsonError("invalid_recipe", "La receta no es válida.", 400)
    validateTimeline(parsed.data.steps)
    await validateRecipeGrind(parsed.data.grind)
    const now = new Date()
    const result = await (await getDatabase()).collection("recipes").insertOne({ ...parsed.data, created_at: now, updated_at: now })
    revalidatePath("/recipes")
    return NextResponse.json({ id: result.insertedId.toString() }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    if (error instanceof GrinderNotFoundError || error instanceof InvalidGrindSettingError) {
      return jsonError("invalid_recipe_grind", "La molienda original no es válida para ese molino.", 400)
    }
    if (error instanceof BrewmarkUnavailableError) {
      return jsonError("brewmark_unavailable", "No se pudo validar la molienda con BrewMark.", 503)
    }
    console.error("admin.recipe_create_failed", error)
    return jsonError("recipe_create_failed", "No se pudo crear la receta.", 400)
  }
}
