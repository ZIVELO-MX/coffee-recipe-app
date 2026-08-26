import { timingSafeEqual } from "node:crypto"
import { auth } from "@clerk/nextjs/server"

function tokenMatches(candidate: string, expected: string) {
  const left = Buffer.from(candidate)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export async function requireRecipeAdmin(request: Request) {
  const configuredToken = process.env.RECIPE_ADMIN_API_TOKEN
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (configuredToken && bearer && tokenMatches(bearer, configuredToken)) return

  const session = await auth()
  const role = (session.sessionClaims?.metadata as { role?: string } | undefined)?.role
  if (!session.isAuthenticated || role !== "admin") {
    throw new Response("Forbidden", { status: 403 })
  }
}
