import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { z } from "zod"
import { authenticateApiKey } from "@/lib/api-keys"
import { getGrinderCatalog } from "@/lib/brewmark"
import {
  bulkRecipeCreateSchema,
  bulkRecipeDeleteSchema,
  bulkRecipePatchItemSchema,
  bulkRecipePatchSchema,
  personalRecipeInputSchema,
} from "@/lib/domain"
import { getDatabase } from "@/lib/db"
import { jsonError } from "@/lib/http"
import { runIdempotentCreation } from "@/lib/idempotency"
import {
  createPersonalRecipe,
  deletePersonalRecipe,
  patchPersonalRecipe,
} from "@/lib/personal-recipes"
import { recipeItemError, recipeMutationErrorResponse, type RecipeItemError } from "@/lib/recipe-api-errors"
import { getViewerDisplayName } from "@/lib/viewer"

type BulkSuccess = { index: number; ok: true; id: string }
type BulkFailure = { index: number; ok: false; id?: string; error: RecipeItemError }
type BulkResult = BulkSuccess | BulkFailure

function response(results: BulkResult[]) {
  const succeeded = results.filter((item) => item.ok).length
  return {
    results,
    summary: { requested: results.length, succeeded, failed: results.length - succeeded },
  }
}

function failure(index: number, error: unknown, id?: string): BulkFailure {
  const expected = recipeItemError(error)
  if (!expected) console.error("recipe_api.bulk_item_failed", { index, id, error })
  return {
    index,
    ok: false,
    ...(id ? { id } : {}),
    error: expected ?? { code: "recipe_write_failed", message: "No se pudo procesar la receta." },
  }
}

function hasDuplicateIds(values: unknown[]): boolean {
  const ids = values.filter((value): value is string => typeof value === "string")
  return new Set(ids).size !== ids.length
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await authenticateApiKey(request)
    const parsed = bulkRecipeCreateSchema.safeParse(await request.json())
    if (!parsed.success) return jsonError("invalid_bulk_request", "El lote no es válido.", 400)
    await getDatabase()
    const validRecipeExists = parsed.data.items.some((item) => personalRecipeInputSchema.safeParse(item).success)
    const grinders = validRecipeExists ? (await getGrinderCatalog()).grinders : []
    const author = await getViewerDisplayName(userId)
    const result = await runIdempotentCreation({
      request,
      userId,
      scope: "POST:/api/recipes/bulk",
      payload: parsed.data,
      resourceCount: parsed.data.items.length,
      execute: async (resourceIds) => {
        const results: BulkResult[] = []
        for (const [index, item] of parsed.data.items.entries()) {
          const recipe = personalRecipeInputSchema.safeParse(item)
          if (!recipe.success) {
            results.push(failure(index, recipe.error))
            continue
          }
          try {
            const id = await createPersonalRecipe(recipe.data, userId, author, { id: resourceIds[index], grinders })
            results.push({ index, ok: true, id })
          } catch (error) {
            results.push(failure(index, error))
          }
        }
        return response(results)
      },
    })
    if (result.summary.succeeded) revalidatePath("/recipes")
    return NextResponse.json(result)
  } catch (error) {
    return recipeMutationErrorResponse(error, "recipe_api.bulk_create_failed", "No se pudo crear el lote.")
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await authenticateApiKey(request)
    const parsed = bulkRecipePatchSchema.safeParse(await request.json())
    if (!parsed.success) return jsonError("invalid_bulk_request", "El lote no es válido.", 400)
    const candidateIds = parsed.data.items.map((item) => (
      typeof item === "object" && item !== null && "id" in item ? item.id : undefined
    ))
    if (hasDuplicateIds(candidateIds)) return jsonError("duplicate_recipe_ids", "El lote contiene IDs duplicados.", 400)
    await getDatabase()
    const grindChangeExists = parsed.data.items.some((item) => {
      const patch = bulkRecipePatchItemSchema.safeParse(item)
      return patch.success && patch.data.changes.grind !== undefined
    })
    const grinders = grindChangeExists ? (await getGrinderCatalog()).grinders : undefined

    const results: BulkResult[] = []
    for (const [index, item] of parsed.data.items.entries()) {
      const patch = bulkRecipePatchItemSchema.safeParse(item)
      if (!patch.success) {
        results.push(failure(index, patch.error))
        continue
      }
      try {
        await patchPersonalRecipe(patch.data.id, patch.data.changes, userId, grinders)
        results.push({ index, ok: true, id: patch.data.id })
      } catch (error) {
        results.push(failure(index, error, patch.data.id))
      }
    }
    const body = response(results)
    if (body.summary.succeeded) revalidatePath("/recipes")
    return NextResponse.json(body)
  } catch (error) {
    return recipeMutationErrorResponse(error, "recipe_api.bulk_update_failed", "No se pudo actualizar el lote.")
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await authenticateApiKey(request)
    const parsed = bulkRecipeDeleteSchema.safeParse(await request.json())
    if (!parsed.success) return jsonError("invalid_bulk_request", "El lote no es válido.", 400)
    if (hasDuplicateIds(parsed.data.ids)) return jsonError("duplicate_recipe_ids", "El lote contiene IDs duplicados.", 400)
    await getDatabase()

    const results: BulkResult[] = []
    for (const [index, item] of parsed.data.ids.entries()) {
      const id = z.string().refine(ObjectId.isValid, "Invalid recipe id").safeParse(item)
      if (!id.success) {
        results.push(failure(index, id.error, typeof item === "string" ? item : undefined))
        continue
      }
      try {
        await deletePersonalRecipe(id.data, userId)
        results.push({ index, ok: true, id: id.data })
      } catch (error) {
        results.push(failure(index, error, id.data))
      }
    }
    const body = response(results)
    if (body.summary.succeeded) {
      revalidatePath("/recipes")
      revalidatePath("/saved")
    }
    return NextResponse.json(body)
  } catch (error) {
    return recipeMutationErrorResponse(error, "recipe_api.bulk_delete_failed", "No se pudo eliminar el lote.")
  }
}
