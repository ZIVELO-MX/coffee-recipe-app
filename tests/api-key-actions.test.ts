import { beforeEach, describe, expect, it, vi } from "vitest"
import { ApiKeyAlreadyExistsError, ApiKeyNotFoundError } from "@/lib/api-keys"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createApiKeyForUser: vi.fn(),
  revalidatePath: vi.fn(),
  rotateApiKeyForUser: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("@/lib/api-keys", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-keys")>()),
  createApiKeyForUser: mocks.createApiKeyForUser,
  rotateApiKeyForUser: mocks.rotateApiKeyForUser,
}))

import { createRecipeApiKey, rotateRecipeApiKey } from "@/app/api-key-actions"

const issued = {
  api_key: "koda_sk_abcdefghijklmnopqrstuvwxyzABCDEFGH123456789",
  status: {
    has_key: true as const,
    last_four: "6789",
    created_at: "2026-09-03T12:00:00.000Z",
    rotated_at: null,
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ userId: "user_1" })
  mocks.createApiKeyForUser.mockResolvedValue(issued)
  mocks.rotateApiKeyForUser.mockResolvedValue(issued)
})

describe("API key server actions", () => {
  it("requires a Clerk session", async () => {
    mocks.auth.mockResolvedValue({ userId: null })
    await expect(createRecipeApiKey()).resolves.toMatchObject({ ok: false, error: { code: "AUTH_REQUIRED" } })
    expect(mocks.createApiKeyForUser).not.toHaveBeenCalled()
  })

  it("creates a key for the signed-in user and refreshes Profile", async () => {
    await expect(createRecipeApiKey()).resolves.toEqual({ ok: true, data: issued })
    expect(mocks.createApiKeyForUser).toHaveBeenCalledWith("user_1")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile")
  })

  it("maps duplicate creation and missing rotation to safe action errors", async () => {
    mocks.createApiKeyForUser.mockRejectedValue(new ApiKeyAlreadyExistsError("duplicate"))
    await expect(createRecipeApiKey()).resolves.toMatchObject({ ok: false, error: { code: "CONFLICT" } })

    mocks.rotateApiKeyForUser.mockRejectedValue(new ApiKeyNotFoundError("missing"))
    await expect(rotateRecipeApiKey()).resolves.toMatchObject({ ok: false, error: { code: "NOT_FOUND" } })
  })

  it("rotates only the signed-in user's key", async () => {
    await expect(rotateRecipeApiKey()).resolves.toEqual({ ok: true, data: issued })
    expect(mocks.rotateApiKeyForUser).toHaveBeenCalledWith("user_1")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile")
  })
})
