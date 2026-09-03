import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
  getDatabase: vi.fn(),
  insertOne: vi.fn(),
  updateOne: vi.fn(),
}))

vi.mock("@/lib/db", () => ({ getDatabase: mocks.getDatabase }))

import {
  IdempotencyConflictError,
  IdempotencyInProgressError,
  InvalidIdempotencyKeyError,
  runIdempotentCreation,
} from "@/lib/idempotency"

function request(key?: string) {
  return new Request("http://localhost/api/recipes", { headers: key ? { "Idempotency-Key": key } : {} })
}

function run(key: string | undefined, payload: unknown, execute = vi.fn().mockResolvedValue({ id: "recipe_1" })) {
  return runIdempotentCreation({
    request: request(key),
    userId: "user_1",
    scope: "POST:/api/recipes",
    payload,
    resourceCount: 1,
    execute,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getDatabase.mockResolvedValue({
    collection: vi.fn().mockReturnValue({
      findOne: mocks.findOne,
      findOneAndUpdate: mocks.findOneAndUpdate,
      insertOne: mocks.insertOne,
      updateOne: mocks.updateOne,
    }),
  })
  mocks.insertOne.mockResolvedValue({ acknowledged: true })
  mocks.updateOne.mockResolvedValue({ acknowledged: true })
})

describe("creation idempotency", () => {
  it("executes normally without a key", async () => {
    const execute = vi.fn().mockResolvedValue({ id: "recipe_1" })
    await expect(run(undefined, { name: "V60" }, execute)).resolves.toEqual({ id: "recipe_1" })
    expect(execute).toHaveBeenCalledOnce()
    expect(mocks.getDatabase).not.toHaveBeenCalled()
  })

  it("stores and replays a completed response", async () => {
    await expect(run("create-1", { name: "V60" })).resolves.toEqual({ id: "recipe_1" })
    expect(mocks.updateOne).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ $set: expect.objectContaining({ state: "completed", response: { id: "recipe_1" } }) }),
    )

    mocks.insertOne.mockRejectedValueOnce({ code: 11000 })
    const inserted = mocks.insertOne.mock.calls[0][0]
    mocks.findOne.mockResolvedValue({
      request_hash: inserted.request_hash,
      state: "completed",
      response: { id: "recipe_1" },
    })
    const execute = vi.fn()
    await expect(run("create-1", { name: "V60" }, execute)).resolves.toEqual({ id: "recipe_1" })
    expect(execute).not.toHaveBeenCalled()
  })

  it("rejects reuse with another payload", async () => {
    mocks.insertOne.mockRejectedValue({ code: 11000 })
    mocks.findOne.mockResolvedValueOnce({ request_hash: "different", state: "completed" })
    await expect(run("create-1", { name: "V60" })).rejects.toBeInstanceOf(IdempotencyConflictError)
  })

  it("rejects a concurrent execution of the same request", async () => {
    await run("create-2", { name: "Kalita" })
    const requestHash = mocks.insertOne.mock.calls[0][0].request_hash
    vi.clearAllMocks()
    mocks.getDatabase.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        findOne: mocks.findOne,
        findOneAndUpdate: mocks.findOneAndUpdate,
        insertOne: mocks.insertOne,
        updateOne: mocks.updateOne,
      }),
    })
    const future = new Date(Date.now() + 60_000)
    mocks.insertOne.mockRejectedValue({ code: 11000 })
    mocks.findOne.mockResolvedValue({ request_hash: requestHash, state: "processing", locked_until: future })
    await expect(run("create-2", { name: "Kalita" })).rejects.toBeInstanceOf(IdempotencyInProgressError)
  })

  it("rejects malformed keys", async () => {
    await expect(run("contains spaces", { name: "V60" })).rejects.toBeInstanceOf(InvalidIdempotencyKeyError)
  })
})
