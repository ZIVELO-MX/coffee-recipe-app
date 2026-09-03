import { beforeEach, describe, expect, it, vi } from "vitest"
import { ObjectId } from "mongodb"
import { NextRequest } from "next/server"
import { InvalidApiKeyError } from "@/lib/api-keys"
import { SEED_RECIPES } from "@/scripts/seed-data"

const mocks = vi.hoisted(() => ({
  authenticateApiKey: vi.fn(),
  createRecipe: vi.fn(),
  getRecipePage: vi.fn(),
  getViewerDisplayName: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("@/lib/api-keys", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-keys")>()),
  authenticateApiKey: mocks.authenticateApiKey,
}))
vi.mock("@/lib/create-recipe", () => ({ createRecipe: mocks.createRecipe }))
vi.mock("@/lib/recipes", () => ({ getRecipePage: mocks.getRecipePage, parseRecipeFilters: vi.fn() }))
vi.mock("@/lib/viewer", () => ({ getViewerDisplayName: mocks.getViewerDisplayName }))

import { POST } from "@/app/api/recipes/route"

const { legacy_id: _legacyId, author: _author, ...input } = SEED_RECIPES[0]

function request(body: unknown, apiKey = "koda_sk_abcdefghijklmnopqrstuvwxyzABCDEFGH123456789") {
  return new NextRequest("http://localhost/api/recipes", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.authenticateApiKey.mockResolvedValue({ userId: "user_1" })
  mocks.getViewerDisplayName.mockResolvedValue("Ana Cafetera")
  mocks.createRecipe.mockResolvedValue("507f1f77bcf86cd799439011")
})

describe("POST /api/recipes", () => {
  it("publishes a recipe attributed to the API key owner", async () => {
    const response = await POST(request(input))
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ id: "507f1f77bcf86cd799439011" })
    expect(mocks.createRecipe).toHaveBeenCalledWith(
      { ...input, author: "Ana Cafetera" },
      { createdByClerkUserId: "user_1", id: expect.any(ObjectId), grindValidated: false },
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/recipes")
  })

  it("rejects missing or invalid API keys", async () => {
    mocks.authenticateApiKey.mockRejectedValue(new InvalidApiKeyError("invalid"))
    const response = await POST(request(input))
    expect(response.status).toBe(401)
    expect(response.headers.get("www-authenticate")).toBe("Bearer")
    expect((await response.json()).error.code).toBe("invalid_api_key")
    expect(mocks.createRecipe).not.toHaveBeenCalled()
  })

  it("rejects author overrides in the request body", async () => {
    const response = await POST(request({ ...input, author: "Otra persona" }))
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe("invalid_recipe")
    expect(mocks.getViewerDisplayName).not.toHaveBeenCalled()
  })

  it("rejects malformed JSON", async () => {
    const malformed = new NextRequest("http://localhost/api/recipes", {
      method: "POST",
      headers: { authorization: "Bearer key", "content-type": "application/json" },
      body: "{",
    })
    const response = await POST(malformed)
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe("invalid_json")
  })
})
