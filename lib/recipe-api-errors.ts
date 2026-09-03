import { ZodError } from "zod"
import { InvalidApiKeyError } from "@/lib/api-keys"
import {
  BrewmarkUnavailableError,
  GrinderNotFoundError,
  InvalidGrindSettingError,
} from "@/lib/brewmark"
import { jsonError } from "@/lib/http"
import {
  IdempotencyConflictError,
  IdempotencyInProgressError,
  InvalidIdempotencyKeyError,
} from "@/lib/idempotency"
import { InvalidRecipeTimelineError, PersonalRecipeNotFoundError } from "@/lib/personal-recipes"

export type RecipeItemError = {
  code: string
  message: string
  fields?: Record<string, string[]>
}

export function recipeItemError(error: unknown): RecipeItemError | null {
  if (error instanceof ZodError) {
    return { code: "invalid_recipe", message: "La receta no es válida.", fields: error.flatten().fieldErrors as Record<string, string[]> }
  }
  if (error instanceof InvalidRecipeTimelineError) {
    return { code: "invalid_recipe_timeline", message: "La secuencia de pasos no es válida." }
  }
  if (error instanceof GrinderNotFoundError || error instanceof InvalidGrindSettingError) {
    return { code: "invalid_recipe_grind", message: "La molienda original no es válida para ese molino." }
  }
  if (error instanceof PersonalRecipeNotFoundError) {
    return { code: "recipe_not_found", message: "Receta no encontrada." }
  }
  return null
}

export function recipeMutationErrorResponse(error: unknown, fallbackCode: string, fallbackMessage: string) {
  if (error instanceof InvalidApiKeyError) {
    const response = jsonError("invalid_api_key", "La API key no es válida.", 401)
    response.headers.set("WWW-Authenticate", "Bearer")
    return response
  }
  if (error instanceof SyntaxError) return jsonError("invalid_json", "El cuerpo debe ser JSON válido.", 400)
  if (error instanceof InvalidIdempotencyKeyError) {
    return jsonError("invalid_idempotency_key", "Idempotency-Key no es válido.", 400)
  }
  if (error instanceof IdempotencyConflictError) {
    return jsonError("idempotency_conflict", "Idempotency-Key ya fue usado con otro contenido.", 409)
  }
  if (error instanceof IdempotencyInProgressError) {
    const response = jsonError("idempotency_in_progress", "La solicitud todavía está en proceso.", 409)
    response.headers.set("Retry-After", "2")
    return response
  }
  const itemError = recipeItemError(error)
  if (itemError) {
    const status = itemError.code === "recipe_not_found" ? 404 : 400
    return jsonError(itemError.code, itemError.message, status, itemError.fields)
  }
  if (error instanceof BrewmarkUnavailableError) {
    return jsonError("brewmark_unavailable", "No se pudo validar la molienda con BrewMark.", 503)
  }
  console.error(fallbackCode, error)
  return jsonError(fallbackCode, fallbackMessage, 503)
}
