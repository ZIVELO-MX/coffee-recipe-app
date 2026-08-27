import { auth } from "@clerk/nextjs/server"
import { ProductFrame } from "@/components/wireframe/product-frame"
import { ScreenGuardados } from "@/components/wireframe/screen-guardados"
import { getSavedRecipes } from "@/lib/recipes"
import { getUserPreferences } from "@/lib/preferences"

export default async function SavedPage() {
  const { userId } = await auth()
  const [recipes, preferences] = await Promise.all([userId ? getSavedRecipes(userId) : Promise.resolve([]), getUserPreferences(userId)])
  return <ProductFrame active="guardados" initialPreferences={preferences}><ScreenGuardados recipes={recipes} signedIn={Boolean(userId)} /></ProductFrame>
}
