import { getDatabase } from "@/lib/db"
import { validateRecipeGrind } from "@/lib/brewmark"
import { validateTimeline, type RecipeInput } from "@/lib/domain"

export async function createRecipe(
  recipe: RecipeInput,
  options: { createdByClerkUserId?: string } = {},
): Promise<string> {
  validateTimeline(recipe.steps)
  await validateRecipeGrind(recipe.grind)
  const now = new Date()
  const result = await (await getDatabase()).collection("recipes").insertOne({
    ...recipe,
    ...(options.createdByClerkUserId ? { created_by_clerk_user_id: options.createdByClerkUserId } : {}),
    created_at: now,
    updated_at: now,
  })
  return result.insertedId.toString()
}
