import { NextResponse } from "next/server"
import { getGrinders } from "@/lib/brewmark"

export async function GET() {
  try {
    return NextResponse.json(await getGrinders())
  } catch (error) {
    console.error("grinders.list_failed", error)
    return NextResponse.json({ error: { code: "grinders_unavailable", message: "No se pudieron cargar los molinos." } }, { status: 503 })
  }
}
