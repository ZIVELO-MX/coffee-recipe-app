import { NextResponse } from "next/server"
import { getGrinderChart } from "@/lib/brewmark"

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    return NextResponse.json(await getGrinderChart(slug))
  } catch (error) {
    console.error("grinders.chart_failed", error)
    return NextResponse.json({ error: { code: "grinder_unavailable", message: "No se pudo cargar este molino." } }, { status: 503 })
  }
}
