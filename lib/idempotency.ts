import { createHash } from "node:crypto"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/db"

const RETENTION_MS = 24 * 60 * 60 * 1000
const LOCK_MS = 2 * 60 * 1000
const KEY_PATTERN = /^[\x21-\x7E]{1,128}$/

export class InvalidIdempotencyKeyError extends Error {}
export class IdempotencyConflictError extends Error {}
export class IdempotencyInProgressError extends Error {}

function hash(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

function duplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000
}

export async function runIdempotentCreation<T>(options: {
  request: Request
  userId: string
  scope: string
  payload: unknown
  resourceCount: number
  execute: (resourceIds: ObjectId[]) => Promise<T>
}): Promise<T> {
  const key = options.request.headers.get("idempotency-key")
  if (key === null) {
    return options.execute(Array.from({ length: options.resourceCount }, () => new ObjectId()))
  }
  if (!KEY_PATTERN.test(key)) throw new InvalidIdempotencyKeyError("Invalid Idempotency-Key")

  const db = await getDatabase()
  const collection = db.collection("api_idempotency")
  const keyHash = hash(key)
  const requestHash = hash(canonicalJson(options.payload))
  const now = new Date()
  const filter = { clerk_user_id: options.userId, scope: options.scope, key_hash: keyHash }
  const resourceIds = Array.from({ length: options.resourceCount }, () => new ObjectId())
  try {
    await collection.insertOne({
      ...filter,
      request_hash: requestHash,
      state: "processing",
      resource_ids: resourceIds,
      locked_until: new Date(now.getTime() + LOCK_MS),
      created_at: now,
      expires_at: new Date(now.getTime() + RETENTION_MS),
    })
  } catch (error) {
    if (!duplicateKey(error)) throw error
    const existing = await collection.findOne(filter)
    if (!existing || existing.request_hash !== requestHash) {
      throw new IdempotencyConflictError("Idempotency-Key was used with a different payload")
    }
    if (existing.state === "completed") return existing.response as T
    if (existing.locked_until instanceof Date && existing.locked_until.getTime() > now.getTime()) {
      throw new IdempotencyInProgressError("Idempotent request is still processing")
    }
    const claimed = await collection.findOneAndUpdate(
      { ...filter, request_hash: requestHash, state: "processing", locked_until: { $lte: now } },
      { $set: { locked_until: new Date(now.getTime() + LOCK_MS) } },
      { returnDocument: "after" },
    )
    if (!claimed) throw new IdempotencyInProgressError("Idempotent request is still processing")
    resourceIds.splice(0, resourceIds.length, ...(claimed.resource_ids as ObjectId[]))
  }

  try {
    const response = await options.execute(resourceIds)
    await collection.updateOne(filter, {
      $set: { state: "completed", response, completed_at: new Date() },
      $unset: { locked_until: "" },
    })
    return response
  } catch (error) {
    await collection.updateOne(filter, { $set: { locked_until: new Date(0) } })
    throw error
  }
}
