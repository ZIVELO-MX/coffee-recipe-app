import { createHash, randomBytes } from "node:crypto"
import { getDatabase } from "@/lib/db"
import type { ApiKeyStatus, IssuedApiKey } from "@/lib/domain"

export const API_KEY_PREFIX = "koda_sk_"
const API_KEY_RANDOM_BYTES = 32
const API_KEY_PATTERN = /^koda_sk_[A-Za-z0-9_-]{43}$/

export class ApiKeyAlreadyExistsError extends Error {}
export class ApiKeyNotFoundError extends Error {}
export class InvalidApiKeyError extends Error {}

export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey, "utf8").digest("hex")
}

export function generateApiKey(): { apiKey: string; hash: string; lastFour: string } {
  const apiKey = `${API_KEY_PREFIX}${randomBytes(API_KEY_RANDOM_BYTES).toString("base64url")}`
  return { apiKey, hash: hashApiKey(apiKey), lastFour: apiKey.slice(-4) }
}

function serializeStatus(document: { key_last_four: string; created_at: Date; rotated_at?: Date | null }): Extract<ApiKeyStatus, { has_key: true }> {
  return {
    has_key: true,
    last_four: document.key_last_four,
    created_at: document.created_at.toISOString(),
    rotated_at: document.rotated_at?.toISOString() ?? null,
  }
}

export async function getApiKeyStatus(userId?: string | null): Promise<ApiKeyStatus> {
  if (!userId) return { has_key: false }
  const document = await (await getDatabase()).collection("api_keys").findOne(
    { clerk_user_id: userId },
    { projection: { key_last_four: 1, created_at: 1, rotated_at: 1 } },
  )
  if (!document) return { has_key: false }
  return serializeStatus({
    key_last_four: document.key_last_four,
    created_at: document.created_at,
    rotated_at: document.rotated_at,
  })
}

export async function createApiKeyForUser(userId: string): Promise<IssuedApiKey> {
  const issued = generateApiKey()
  const createdAt = new Date()
  try {
    await (await getDatabase()).collection("api_keys").insertOne({
      clerk_user_id: userId,
      key_hash: issued.hash,
      key_last_four: issued.lastFour,
      created_at: createdAt,
      rotated_at: null,
    })
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      throw new ApiKeyAlreadyExistsError("The user already has an API key")
    }
    throw error
  }
  return {
    api_key: issued.apiKey,
    status: serializeStatus({ key_last_four: issued.lastFour, created_at: createdAt, rotated_at: null }),
  }
}

export async function rotateApiKeyForUser(userId: string): Promise<IssuedApiKey> {
  const issued = generateApiKey()
  const rotatedAt = new Date()
  const result = await (await getDatabase()).collection("api_keys").findOneAndUpdate(
    { clerk_user_id: userId },
    {
      $set: {
        key_hash: issued.hash,
        key_last_four: issued.lastFour,
        rotated_at: rotatedAt,
      },
    },
    { returnDocument: "after", projection: { key_last_four: 1, created_at: 1, rotated_at: 1 } },
  )
  if (!result) throw new ApiKeyNotFoundError("The user does not have an API key")
  return {
    api_key: issued.apiKey,
    status: serializeStatus({
      key_last_four: result.key_last_four,
      created_at: result.created_at,
      rotated_at: result.rotated_at,
    }),
  }
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization")
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i)
  return match?.[1] ?? null
}

export async function authenticateApiKey(request: Request): Promise<{ userId: string }> {
  const apiKey = bearerToken(request)
  if (!apiKey || !API_KEY_PATTERN.test(apiKey)) throw new InvalidApiKeyError("Invalid API key")
  const document = await (await getDatabase()).collection("api_keys").findOne(
    { key_hash: hashApiKey(apiKey) },
    { projection: { clerk_user_id: 1 } },
  )
  if (!document?.clerk_user_id) throw new InvalidApiKeyError("Invalid API key")
  return { userId: document.clerk_user_id }
}
