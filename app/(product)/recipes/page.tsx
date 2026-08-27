import { auth } from "@clerk/nextjs/server"
import { ScreenBuscar } from "@/components/wireframe/screen-buscar"
import { ProductFrame } from "@/components/wireframe/product-frame"
import { getRecipePage, parseRecipeFilters } from "@/lib/recipes"
import { getUserPreferences } from "@/lib/preferences"

export default async function RecipesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, session] = await Promise.all([searchParams, auth()])
  const filters = parseRecipeFilters(params)
  const [result, preferences] = await Promise.all([getRecipePage(filters, session.userId), getUserPreferences(session.userId)])
  return <ProductFrame active="buscar" initialPreferences={preferences}><ScreenBuscar result={result} filters={filters} /></ProductFrame>
}
