import { NextResponse } from "next/server"
import { FALLBACK_GRINDERS, getGrinders } from "@/lib/brewmark"

export async function GET() {
  try {
    return NextResponse.json(await getGrinders())
  } catch (error) {
    console.warn("grinders.list_failed_using_fallback", error)
    return NextResponse.json({ grinders: FALLBACK_GRINDERS, count: FALLBACK_GRINDERS.length, source: "fallback" })
  }
}
