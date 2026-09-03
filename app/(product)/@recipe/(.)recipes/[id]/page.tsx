import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { RecipeModalRoute } from "@/components/wireframe/recipe-modal-route"
import { BrewmarkUnavailableError, GrinderNotFoundError } from "@/lib/brewmark"
import { getUserPreferences } from "@/lib/preferences"
import { getRecipeById } from "@/lib/recipes"

export default async function InterceptedRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { userId }] = await Promise.all([params, auth()])
  const preferencesPromise = getUserPreferences(userId)
  const recipePromise = preferencesPromise
    .then((preferences) => getRecipeById(id, userId, preferences.default_grinder_id))
    .catch((error) => error instanceof BrewmarkUnavailableError || error instanceof GrinderNotFoundError
      ? getRecipeById(id, userId)
      : Promise.reject(error))
  const [recipe, preferences] = await Promise.all([recipePromise, preferencesPromise])
  if (!recipe) notFound()
  return <RecipeModalRoute recipe={recipe} preferences={preferences} />
}
