import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { RecipeModalRoute } from "@/components/wireframe/recipe-modal-route"
import { getUserPreferences } from "@/lib/preferences"
import { getRecipeById } from "@/lib/recipes"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const recipe = await getRecipeById((await params).id)
  return recipe ? { title: `${recipe.name} — Cafeína`, description: `Receta de ${recipe.author} para ${recipe.method}.` } : { title: "Receta no encontrada — Cafeína" }
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { userId }] = await Promise.all([params, auth()])
  const [recipe, preferences] = await Promise.all([getRecipeById(id, userId), getUserPreferences(userId)])
  if (!recipe) notFound()
  return <RecipeModalRoute recipe={recipe} preferences={preferences} direct />
}
