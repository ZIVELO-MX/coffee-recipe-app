import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/db"
import { validateRecipeGrind } from "@/lib/brewmark"
import { recipeAppearance, validateTimeline, type RecipeInput } from "@/lib/domain"

export async function createRecipe(
  recipe: RecipeInput,
  options: { createdByClerkUserId?: string; id?: ObjectId; grindValidated?: boolean } = {},
): Promise<string> {
  validateTimeline(recipe.steps)
  if (!options.grindValidated) await validateRecipeGrind(recipe.grind)
  const now = new Date()
  const document = {
    ...recipe,
    appearance: recipeAppearance(recipe.method, recipe.appearance),
    ...(options.createdByClerkUserId ? { created_by_clerk_user_id: options.createdByClerkUserId } : {}),
    created_at: now,
    updated_at: now,
  }
  const collection = (await getDatabase()).collection("recipes")
  if (options.id) {
    await collection.updateOne(
      { _id: options.id },
      { $setOnInsert: document },
      { upsert: true },
    )
    return options.id.toString()
  }
  const result = await collection.insertOne(document)
  return result.insertedId.toString()
}
