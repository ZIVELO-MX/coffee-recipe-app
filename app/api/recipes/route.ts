import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { jsonError } from "@/lib/http"
import { recipeInputSchema, validateTimeline, totalSeconds } from "@/lib/domain"

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const page = Math.max(Number(params.get("page") ?? 1), 1)
    const pageSize = Math.min(Math.max(Number(params.get("pageSize") ?? 20), 1), 50)
    const q = params.get("q")?.trim()
    const method = params.get("method")?.split(",").filter(Boolean)
    const query: Record<string, unknown> = {}
    if (q) query.$text = { $search: q }
    if (method?.length) query.method = { $in: method }

    const db = await getDatabase()
    const recipes = await db.collection("recipes").find(query).sort({ _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray()
    const total = await db.collection("recipes").countDocuments(query)
    const data = recipes.map((recipe) => ({
      ...recipe,
      _id: recipe._id.toString(),
      total_seconds: totalSeconds(recipe.steps),
      like_count: 0,
      viewer_liked: false,
      viewer_saved: false,
    }))
    return NextResponse.json({ data, total, page, pageSize })
  } catch (error) {
    console.error("recipes.list_failed", error)
    return jsonError("recipes_unavailable", "No se pudieron cargar las recetas.", 503)
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = recipeInputSchema.safeParse(await request.json())
    if (!parsed.success) return jsonError("invalid_recipe", "La receta no es válida.", 400)
    validateTimeline(parsed.data.steps)
    const db = await getDatabase()
    const now = new Date()
    const result = await db.collection("recipes").insertOne({ ...parsed.data, created_at: now, updated_at: now })
    return NextResponse.json({ id: result.insertedId.toString() }, { status: 201 })
  } catch (error) {
    console.error("recipes.create_failed", error)
    return jsonError("recipe_create_failed", "No se pudo crear la receta.", 400)
  }
}
