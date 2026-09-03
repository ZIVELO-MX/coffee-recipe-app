import { NextResponse } from "next/server"
import { OPENAPI_DOCUMENT } from "@/lib/openapi"

export function GET() {
  return NextResponse.json(OPENAPI_DOCUMENT, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  })
}
