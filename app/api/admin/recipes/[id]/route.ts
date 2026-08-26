import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
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
    const result = await (await getDatabase()).collection("recipes").replaceOne(
      { _id: new ObjectId(id) },
      { ...parsed.data, updated_at: new Date() },
    )
    if (!result.matchedCount) return jsonError("recipe_not_found", "Receta no encontrada.", 404)
    return NextResponse.json({ updated: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("admin.recipe_update_failed", { id, error })
    return jsonError("recipe_update_failed", "No se pudo actualizar la receta.", 400)
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return jsonError("invalid_recipe_id", "El identificador no es válido.", 400)
  try {
    await requireRecipeAdmin(request)
    const result = await (await getDatabase()).collection("recipes").deleteOne({ _id: new ObjectId(id) })
    if (!result.deletedCount) return jsonError("recipe_not_found", "Receta no encontrada.", 404)
    return new Response(null, { status: 204 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("admin.recipe_delete_failed", { id, error })
    return jsonError("recipe_delete_failed", "No se pudo eliminar la receta.", 400)
  }
}
