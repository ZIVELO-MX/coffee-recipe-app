import { auth } from "@clerk/nextjs/server"
import { ScreenGuardados } from "@/components/wireframe/screen-guardados"
import { TabPageTransition } from "@/components/wireframe/tab-page-transition"
import { getSavedRecipes } from "@/lib/recipes"

export default async function SavedPage() {
  const { userId } = await auth()
  const recipes = userId ? await getSavedRecipes(userId) : []
  return <TabPageTransition><ScreenGuardados recipes={recipes} signedIn={Boolean(userId)} /></TabPageTransition>
}
