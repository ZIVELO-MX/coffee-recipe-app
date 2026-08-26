import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { jsonError } from "@/lib/http"
import { totalSeconds } from "@/lib/domain"

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return jsonError("invalid_recipe_id", "El identificador no es válido.", 400)
  try {
    const db = await getDatabase()
    const recipe = await db.collection("recipes").findOne({ _id: new ObjectId(id) })
    if (!recipe) return jsonError("recipe_not_found", "Receta no encontrada.", 404)
    return NextResponse.json({
      ...recipe,
      _id: recipe._id.toString(),
      total_seconds: totalSeconds(recipe.steps),
      like_count: 0,
      viewer_liked: false,
      viewer_saved: false,
    })
  } catch (error) {
    console.error("recipe.get_failed", { id, error })
    return jsonError("recipe_unavailable", "No se pudo cargar la receta.", 503)
  }
}
