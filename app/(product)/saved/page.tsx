import { auth } from "@clerk/nextjs/server"
import { ProductFrame } from "@/components/wireframe/product-frame"
import { ScreenGuardados } from "@/components/wireframe/screen-guardados"
import { getSavedRecipes } from "@/lib/recipes"

export default async function SavedPage() {
  const { userId } = await auth()
  const recipes = userId ? await getSavedRecipes(userId) : []
  return <ProductFrame active="guardados"><ScreenGuardados recipes={recipes} signedIn={Boolean(userId)} /></ProductFrame>
}
