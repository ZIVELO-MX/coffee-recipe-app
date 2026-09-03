"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import {
  ApiKeyAlreadyExistsError,
  ApiKeyNotFoundError,
  createApiKeyForUser,
  rotateApiKeyForUser,
} from "@/lib/api-keys"
import type { ActionResult, IssuedApiKey } from "@/lib/domain"

function failure(
  code: "AUTH_REQUIRED" | "NOT_FOUND" | "CONFLICT" | "DB_UNAVAILABLE",
  message: string,
): ActionResult<IssuedApiKey> {
  return { ok: false, error: { code, message } }
}

export async function createRecipeApiKey(): Promise<ActionResult<IssuedApiKey>> {
  const { userId } = await auth()
  if (!userId) return failure("AUTH_REQUIRED", "Inicia sesión para crear una API key.")
  try {
    const issued = await createApiKeyForUser(userId)
    revalidatePath("/profile")
    return { ok: true, data: issued }
  } catch (error) {
    if (error instanceof ApiKeyAlreadyExistsError) {
      return failure("CONFLICT", "Ya existe una API key. Recarga la página para rotarla.")
    }
    console.error("api_key.create_failed", { userId, error })
    return failure("DB_UNAVAILABLE", "No se pudo crear la API key.")
  }
}

export async function rotateRecipeApiKey(): Promise<ActionResult<IssuedApiKey>> {
  const { userId } = await auth()
  if (!userId) return failure("AUTH_REQUIRED", "Inicia sesión para rotar tu API key.")
  try {
    const issued = await rotateApiKeyForUser(userId)
    revalidatePath("/profile")
    return { ok: true, data: issued }
  } catch (error) {
    if (error instanceof ApiKeyNotFoundError) {
      return failure("NOT_FOUND", "La API key ya no existe. Recarga la página para crear otra.")
    }
    console.error("api_key.rotate_failed", { userId, error })
    return failure("DB_UNAVAILABLE", "No se pudo rotar la API key.")
  }
}
