import { beforeEach, describe, expect, it, vi } from "vitest"
import { ObjectId } from "mongodb"
import { NextRequest } from "next/server"
import { PersonalRecipeNotFoundError } from "@/lib/personal-recipes"
import { SEED_RECIPES } from "@/scripts/seed-data"

const mocks = vi.hoisted(() => ({
  authenticateApiKey: vi.fn(),
  createPersonalRecipe: vi.fn(),
  deletePersonalRecipe: vi.fn(),
  getDatabase: vi.fn(),
  getGrinderCatalog: vi.fn(),
  getViewerDisplayName: vi.fn(),
  patchPersonalRecipe: vi.fn(),
  revalidatePath: vi.fn(),
  runIdempotentCreation: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("@/lib/api-keys", () => ({ authenticateApiKey: mocks.authenticateApiKey, InvalidApiKeyError: class extends Error {} }))
vi.mock("@/lib/db", () => ({ getDatabase: mocks.getDatabase }))
vi.mock("@/lib/brewmark", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/brewmark")>()),
  getGrinderCatalog: mocks.getGrinderCatalog,
}))
vi.mock("@/lib/idempotency", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/idempotency")>()),
  runIdempotentCreation: mocks.runIdempotentCreation,
}))
vi.mock("@/lib/personal-recipes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/personal-recipes")>()),
  createPersonalRecipe: mocks.createPersonalRecipe,
  deletePersonalRecipe: mocks.deletePersonalRecipe,
  patchPersonalRecipe: mocks.patchPersonalRecipe,
}))
vi.mock("@/lib/viewer", () => ({ getViewerDisplayName: mocks.getViewerDisplayName }))

import { DELETE, PATCH, POST } from "@/app/api/recipes/bulk/route"

const { legacy_id: _legacyId, author: _author, ...recipe } = SEED_RECIPES[0]
const firstId = "507f1f77bcf86cd799439011"
const secondId = "507f191e810c19729de860ea"

function request(method: string, body: unknown) {
  return new NextRequest("http://localhost/api/recipes/bulk", { method, body: JSON.stringify(body) })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.authenticateApiKey.mockResolvedValue({ userId: "user_1" })
  mocks.getDatabase.mockResolvedValue({})
  mocks.getGrinderCatalog.mockResolvedValue({ grinders: [] })
  mocks.getViewerDisplayName.mockResolvedValue("Ana Cafetera")
  mocks.runIdempotentCreation.mockImplementation(async ({ resourceCount, execute }) => (
    execute(Array.from({ length: resourceCount }, () => new ObjectId()))
  ))
  mocks.createPersonalRecipe.mockResolvedValue(firstId)
})

describe("personal recipe bulk API", () => {
  it("creates valid items and reports invalid items without aborting the lot", async () => {
    const response = await POST(request("POST", { items: [recipe, { name: "Incompleta" }] }))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      results: [
        { index: 0, ok: true, id: firstId },
        { index: 1, ok: false, error: { code: "invalid_recipe" } },
      ],
      summary: { requested: 2, succeeded: 1, failed: 1 },
    })
    expect(mocks.createPersonalRecipe).toHaveBeenCalledTimes(1)
    expect(mocks.getGrinderCatalog).toHaveBeenCalledOnce()
  })

  it("reports foreign recipes as not found while updating other items", async () => {
    mocks.patchPersonalRecipe.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new PersonalRecipeNotFoundError("foreign"))
    const response = await PATCH(request("PATCH", { items: [
      { id: firstId, changes: { name: "Uno" } },
      { id: secondId, changes: { name: "Dos" } },
    ] }))
    expect(await response.json()).toMatchObject({
      results: [
        { index: 0, ok: true, id: firstId },
        { index: 1, ok: false, id: secondId, error: { code: "recipe_not_found" } },
      ],
      summary: { requested: 2, succeeded: 1, failed: 1 },
    })
  })

  it("rejects duplicate IDs before applying updates", async () => {
    const response = await PATCH(request("PATCH", { items: [
      { id: firstId, changes: { name: "Uno" } },
      { id: firstId, changes: { name: "Dos" } },
    ] }))
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe("duplicate_recipe_ids")
    expect(mocks.patchPersonalRecipe).not.toHaveBeenCalled()
  })

  it("rejects lots larger than 50 items", async () => {
    const response = await POST(request("POST", { items: Array.from({ length: 51 }, () => recipe) }))
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe("invalid_bulk_request")
    expect(mocks.createPersonalRecipe).not.toHaveBeenCalled()
  })

  it("deletes valid IDs and reports malformed IDs per item", async () => {
    const response = await DELETE(request("DELETE", { ids: [firstId, "bad-id"] }))
    expect(await response.json()).toMatchObject({
      results: [
        { index: 0, ok: true, id: firstId },
        { index: 1, ok: false, id: "bad-id", error: { code: "invalid_recipe" } },
      ],
      summary: { requested: 2, succeeded: 1, failed: 1 },
    })
    expect(mocks.deletePersonalRecipe).toHaveBeenCalledOnce()
  })
})
