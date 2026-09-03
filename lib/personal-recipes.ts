import { ObjectId } from "mongodb"
import {
  validateRecipeGrind,
  validateRecipeGrindFromCatalog,
  type BrewmarkGrinder,
} from "@/lib/brewmark"
import { createRecipe } from "@/lib/create-recipe"
import { getDatabase } from "@/lib/db"
import {
  recipeInputSchema,
  validateTimeline,
  type PersonalRecipeInput,
  type PersonalRecipePatch,
  type RecipeInput,
} from "@/lib/domain"

export class PersonalRecipeNotFoundError extends Error {}
export class InvalidRecipeTimelineError extends Error {}

function validateRecipeTimeline(recipe: RecipeInput): void {
  try {
    validateTimeline(recipe.steps)
  } catch (error) {
    throw new InvalidRecipeTimelineError("The recipe timeline is invalid", { cause: error })
  }
}

export async function createPersonalRecipe(
  input: PersonalRecipeInput,
  userId: string,
  author: string,
  options: { id?: ObjectId; grinders?: BrewmarkGrinder[] } = {},
): Promise<string> {
  const recipe = { ...input, author }
  validateRecipeTimeline(recipe)
  if (options.grinders) validateRecipeGrindFromCatalog(recipe.grind, options.grinders)
  return createRecipe(recipe, {
    createdByClerkUserId: userId,
    id: options.id,
    grindValidated: options.grinders !== undefined,
  })
}

export async function patchPersonalRecipe(
  id: string,
  changes: PersonalRecipePatch,
  userId: string,
  grinders?: BrewmarkGrinder[],
): Promise<void> {
  if (!ObjectId.isValid(id)) throw new PersonalRecipeNotFoundError("Recipe not found")
  const db = await getDatabase()
  const recipeId = new ObjectId(id)
  const current = await db.collection("recipes").findOne({
    _id: recipeId,
    created_by_clerk_user_id: userId,
  })
  if (!current) throw new PersonalRecipeNotFoundError("Recipe not found")

  const currentInput = recipeInputSchema.parse({
    name: current.name,
    author: current.author,
    method: current.method,
    coffee_g: current.coffee_g,
    water_ml: current.water_ml,
    temperature_c: current.temperature_c,
    grind: current.grind,
    preparation: current.preparation,
    steps: current.steps,
    ...(current.appearance ? { appearance: current.appearance } : {}),
  })
  const candidate = recipeInputSchema.parse({
    ...currentInput,
    ...changes,
  })
  validateRecipeTimeline(candidate)
  if (changes.grind) {
    if (grinders) validateRecipeGrindFromCatalog(candidate.grind, grinders)
    else await validateRecipeGrind(candidate.grind)
  }

  const update = {
    $set: { ...changes, updated_at: new Date() },
    $unset: { image: "" },
  }
  const result = await db.collection("recipes").updateOne(
    { _id: recipeId, created_by_clerk_user_id: userId },
    update,
  )
  if (!result.matchedCount) throw new PersonalRecipeNotFoundError("Recipe not found")
}

export async function deletePersonalRecipe(id: string, userId: string): Promise<void> {
  if (!ObjectId.isValid(id)) throw new PersonalRecipeNotFoundError("Recipe not found")
  const db = await getDatabase()
  const recipeId = new ObjectId(id)
  const result = await db.collection("recipes").deleteOne({
    _id: recipeId,
    created_by_clerk_user_id: userId,
  })
  if (!result.deletedCount) throw new PersonalRecipeNotFoundError("Recipe not found")
  await Promise.all([
    db.collection("likes").deleteMany({ recipe_id: recipeId }),
    db.collection("saved_recipes").deleteMany({ recipe_id: recipeId }),
  ])
}
