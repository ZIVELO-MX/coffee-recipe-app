import { NextResponse } from "next/server"

export function jsonError(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string[]>,
) {
  return NextResponse.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status },
  )
}
