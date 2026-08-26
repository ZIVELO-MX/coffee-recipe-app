import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { RecipeModalRoute } from "@/components/wireframe/recipe-modal-route"
import { getUserPreferences } from "@/lib/preferences"
import { getRecipeById } from "@/lib/recipes"

export default async function InterceptedRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { userId }] = await Promise.all([params, auth()])
  const [recipe, preferences] = await Promise.all([getRecipeById(id, userId), getUserPreferences(userId)])
  if (!recipe) notFound()
  return <RecipeModalRoute recipe={recipe} preferences={preferences} />
}
