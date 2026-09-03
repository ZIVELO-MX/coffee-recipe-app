import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { InvalidApiKeyError } from "@/lib/api-keys"
import { PersonalRecipeNotFoundError } from "@/lib/personal-recipes"

const mocks = vi.hoisted(() => ({
  authenticateApiKey: vi.fn(),
  deletePersonalRecipe: vi.fn(),
  patchPersonalRecipe: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("@/lib/api-keys", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-keys")>()),
  authenticateApiKey: mocks.authenticateApiKey,
}))
vi.mock("@/lib/personal-recipes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/personal-recipes")>()),
  deletePersonalRecipe: mocks.deletePersonalRecipe,
  patchPersonalRecipe: mocks.patchPersonalRecipe,
}))
vi.mock("@/lib/recipes", () => ({ getRecipeById: vi.fn() }))

import { DELETE, PATCH } from "@/app/api/recipes/[id]/route"

const recipeId = "507f1f77bcf86cd799439011"
const context = { params: Promise.resolve({ id: recipeId }) }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.authenticateApiKey.mockResolvedValue({ userId: "user_1" })
})

describe("personal recipe mutations", () => {
  it("patches only a recipe owned by the API key user", async () => {
    const request = new NextRequest(`http://localhost/api/recipes/${recipeId}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "V60 diario" }),
    })
    const response = await PATCH(request, context)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: recipeId, updated: true })
    expect(mocks.patchPersonalRecipe).toHaveBeenCalledWith(recipeId, { name: "V60 diario" }, "user_1")
  })

  it("does not reveal whether a missing or foreign recipe exists", async () => {
    mocks.patchPersonalRecipe.mockRejectedValue(new PersonalRecipeNotFoundError("missing"))
    const response = await PATCH(new NextRequest(`http://localhost/api/recipes/${recipeId}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "Ajena" }),
    }), context)
    expect(response.status).toBe(404)
    expect((await response.json()).error.code).toBe("recipe_not_found")
  })

  it("rejects author overrides and empty patches", async () => {
    for (const body of [{}, { author: "Otra persona" }]) {
      const response = await PATCH(new NextRequest(`http://localhost/api/recipes/${recipeId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }), context)
      expect(response.status).toBe(400)
      expect((await response.json()).error.code).toBe("invalid_recipe")
    }
    expect(mocks.patchPersonalRecipe).not.toHaveBeenCalled()
  })

  it("hard-deletes an owned recipe", async () => {
    const response = await DELETE(new NextRequest(`http://localhost/api/recipes/${recipeId}`, { method: "DELETE" }), context)
    expect(response.status).toBe(204)
    expect(mocks.deletePersonalRecipe).toHaveBeenCalledWith(recipeId, "user_1")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/saved")
  })

  it("requires a valid personal API key", async () => {
    mocks.authenticateApiKey.mockRejectedValue(new InvalidApiKeyError("invalid"))
    const response = await DELETE(new NextRequest(`http://localhost/api/recipes/${recipeId}`, { method: "DELETE" }), context)
    expect(response.status).toBe(401)
    expect(response.headers.get("www-authenticate")).toBe("Bearer")
  })
})
