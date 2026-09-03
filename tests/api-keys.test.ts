import { beforeEach, describe, expect, it, vi } from "vitest"

const { collectionMock, findOneMock, findOneAndUpdateMock, getDatabaseMock, insertOneMock } = vi.hoisted(() => ({
  collectionMock: vi.fn(),
  findOneMock: vi.fn(),
  findOneAndUpdateMock: vi.fn(),
  getDatabaseMock: vi.fn(),
  insertOneMock: vi.fn(),
}))

vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }))

import {
  API_KEY_PREFIX,
  InvalidApiKeyError,
  authenticateApiKey,
  createApiKeyForUser,
  generateApiKey,
  hashApiKey,
  rotateApiKeyForUser,
} from "@/lib/api-keys"

beforeEach(() => {
  vi.clearAllMocks()
  collectionMock.mockReturnValue({ findOne: findOneMock, findOneAndUpdate: findOneAndUpdateMock, insertOne: insertOneMock })
  getDatabaseMock.mockResolvedValue({ collection: collectionMock })
  insertOneMock.mockResolvedValue({ acknowledged: true })
})

describe("personal API keys", () => {
  it("generates unique high-entropy keys with a stable prefix", () => {
    const first = generateApiKey()
    const second = generateApiKey()
    expect(first.apiKey).toMatch(/^koda_sk_[A-Za-z0-9_-]{43}$/)
    expect(second.apiKey).not.toBe(first.apiKey)
    expect(first.hash).toBe(hashApiKey(first.apiKey))
    expect(first.apiKey.startsWith(API_KEY_PREFIX)).toBe(true)
  })

  it("stores only the hash and last four characters", async () => {
    const issued = await createApiKeyForUser("user_1")
    const stored = insertOneMock.mock.calls[0][0]
    expect(stored).toMatchObject({
      clerk_user_id: "user_1",
      key_hash: hashApiKey(issued.api_key),
      key_last_four: issued.api_key.slice(-4),
    })
    expect(stored).not.toHaveProperty("api_key")
    expect(JSON.stringify(stored)).not.toContain(issued.api_key)
  })

  it("authenticates a valid bearer key by its hash", async () => {
    const { apiKey } = generateApiKey()
    findOneMock.mockResolvedValue({ clerk_user_id: "user_1" })
    await expect(authenticateApiKey(new Request("http://localhost", {
      headers: { authorization: `Bearer ${apiKey}` },
    }))).resolves.toEqual({ userId: "user_1" })
    expect(findOneMock).toHaveBeenCalledWith(
      { key_hash: hashApiKey(apiKey) },
      { projection: { clerk_user_id: 1 } },
    )
  })

  it("rejects missing, malformed, and unknown keys with the same error", async () => {
    await expect(authenticateApiKey(new Request("http://localhost"))).rejects.toBeInstanceOf(InvalidApiKeyError)
    await expect(authenticateApiKey(new Request("http://localhost", {
      headers: { authorization: "Bearer not-a-koda-key" },
    }))).rejects.toBeInstanceOf(InvalidApiKeyError)

    const { apiKey } = generateApiKey()
    findOneMock.mockResolvedValue(null)
    await expect(authenticateApiKey(new Request("http://localhost", {
      headers: { authorization: `Bearer ${apiKey}` },
    }))).rejects.toBeInstanceOf(InvalidApiKeyError)
  })

  it("replaces the stored hash when rotating", async () => {
    const createdAt = new Date("2026-09-01T00:00:00.000Z")
    findOneAndUpdateMock.mockImplementation(async (_filter, update) => ({
      key_last_four: update.$set.key_last_four,
      created_at: createdAt,
      rotated_at: update.$set.rotated_at,
    }))
    const issued = await rotateApiKeyForUser("user_1")
    const [filter, update] = findOneAndUpdateMock.mock.calls[0]
    expect(filter).toEqual({ clerk_user_id: "user_1" })
    expect(update.$set.key_hash).toBe(hashApiKey(issued.api_key))
    expect(update.$set).not.toHaveProperty("api_key")
    expect(issued.status.created_at).toBe(createdAt.toISOString())
    expect(issued.status.rotated_at).not.toBeNull()
  })
})
