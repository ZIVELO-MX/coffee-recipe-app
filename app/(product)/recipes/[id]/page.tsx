import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { RecipeModalRoute } from "@/components/wireframe/recipe-modal-route"
import { BrewmarkUnavailableError, GrinderNotFoundError } from "@/lib/brewmark"
import { getUserPreferences } from "@/lib/preferences"
import { getRecipeById, getRecipeShareData } from "@/lib/recipes"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = (await params).id
  const recipe = await getRecipeShareData(id)
  if (!recipe) return { title: "Receta no encontrada", robots: { index: false } }
  const description = `Receta de ${recipe.author} para ${recipe.method}: ${recipe.coffeeGrams} g de café y ${recipe.waterMilliliters} ml de agua.`
  const url = `/recipes/${id}`
  return {
    title: recipe.name,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", locale: "es_MX", siteName: "Koda Brew", title: recipe.name, description, url },
    twitter: { card: "summary_large_image", title: recipe.name, description },
  }
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { userId }] = await Promise.all([params, auth()])
  const preferencesPromise = getUserPreferences(userId)
  const recipePromise = preferencesPromise
    .then((preferences) => getRecipeById(id, userId, preferences.default_grinder_id))
    .catch((error) => error instanceof BrewmarkUnavailableError || error instanceof GrinderNotFoundError
      ? getRecipeById(id, userId)
      : Promise.reject(error))
  const [recipe, preferences] = await Promise.all([recipePromise, preferencesPromise])
  if (!recipe) notFound()
  return <RecipeModalRoute recipe={recipe} preferences={preferences} direct />
}
