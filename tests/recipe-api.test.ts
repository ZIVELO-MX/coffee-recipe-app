import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { BrewmarkUnavailableError, GrinderNotFoundError } from "@/lib/brewmark"

const { authMock, getRecipeByIdMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getRecipeByIdMock: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }))
vi.mock("@/lib/recipes", () => ({ getRecipeById: getRecipeByIdMock }))

import { GET } from "@/app/api/recipes/[id]/route"

const recipeId = "507f1f77bcf86cd799439011"
const context = { params: Promise.resolve({ id: recipeId }) }

beforeEach(() => {
  vi.clearAllMocks()
  authMock.mockResolvedValue({ userId: "user_1" })
})

describe("GET /api/recipes/:id", () => {
  it("returns only the source grind when no target is requested", async () => {
    const recipe = { _id: recipeId, grind: { source: { grinder_id: 62, grinder_name: "Baratza Encore ESP", setting: 28, setting_unit: "NUMBER" } } }
    getRecipeByIdMock.mockResolvedValue(recipe)
    const response = await GET(new NextRequest(`http://localhost/api/recipes/${recipeId}`), context)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(recipe)
    expect(getRecipeByIdMock).toHaveBeenCalledWith(recipeId, "user_1", undefined)
  })

  it("passes a numeric target grinder to the recipe service", async () => {
    getRecipeByIdMock.mockResolvedValue({ _id: recipeId })
    const response = await GET(new NextRequest(`http://localhost/api/recipes/${recipeId}?grinder=76`), context)
    expect(response.status).toBe(200)
    expect(getRecipeByIdMock).toHaveBeenCalledWith(recipeId, "user_1", 76)
  })

  it("rejects malformed grinder identifiers", async () => {
    const response = await GET(new NextRequest(`http://localhost/api/recipes/${recipeId}?grinder=timemore-c3`), context)
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe("invalid_grinder_id")
    expect(getRecipeByIdMock).not.toHaveBeenCalled()
  })

  it("maps missing grinders and BrewMark outages to explicit errors", async () => {
    getRecipeByIdMock.mockRejectedValueOnce(new GrinderNotFoundError("missing"))
    const missing = await GET(new NextRequest(`http://localhost/api/recipes/${recipeId}?grinder=999`), context)
    expect(missing.status).toBe(404)
    expect((await missing.json()).error.code).toBe("grinder_not_found")

    getRecipeByIdMock.mockRejectedValueOnce(new BrewmarkUnavailableError("offline"))
    const unavailable = await GET(new NextRequest(`http://localhost/api/recipes/${recipeId}?grinder=76`), context)
    expect(unavailable.status).toBe(503)
    expect((await unavailable.json()).error.code).toBe("grind_conversion_unavailable")
  })
})
