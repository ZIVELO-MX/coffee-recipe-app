import { auth } from "@clerk/nextjs/server"
import { ScreenBuscar } from "@/components/wireframe/screen-buscar"
import { ProductFrame } from "@/components/wireframe/product-frame"
import { getRecipePage, parseRecipeFilters } from "@/lib/recipes"

export default async function RecipesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, session] = await Promise.all([searchParams, auth()])
  const filters = parseRecipeFilters(params)
  const result = await getRecipePage(filters, session.userId)
  return <ProductFrame active="buscar"><ScreenBuscar result={result} filters={filters} /></ProductFrame>
}
