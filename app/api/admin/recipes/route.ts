import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { recipeInputSchema, validateTimeline } from "@/lib/domain"
import { jsonError } from "@/lib/http"
import { requireRecipeAdmin } from "@/lib/admin"

export async function POST(request: NextRequest) {
  try {
    await requireRecipeAdmin(request)
    const parsed = recipeInputSchema.safeParse(await request.json())
    if (!parsed.success) return jsonError("invalid_recipe", "La receta no es válida.", 400)
    validateTimeline(parsed.data.steps)
    const now = new Date()
    const result = await (await getDatabase()).collection("recipes").insertOne({ ...parsed.data, created_at: now, updated_at: now })
    return NextResponse.json({ id: result.insertedId.toString() }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("admin.recipe_create_failed", error)
    return jsonError("recipe_create_failed", "No se pudo crear la receta.", 400)
  }
}
