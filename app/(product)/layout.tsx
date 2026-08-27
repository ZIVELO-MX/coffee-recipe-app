import type { ReactNode } from "react"
import { auth } from "@clerk/nextjs/server"
import { ProductFrame } from "@/components/wireframe/product-frame"
import { getUserPreferences } from "@/lib/preferences"

export default async function ProductLayout({ children, recipe }: { children: ReactNode; recipe: ReactNode }) {
  const { userId } = await auth()
  const preferences = await getUserPreferences(userId)
  return <ProductFrame initialPreferences={preferences} recipeSlot={recipe}>{children}</ProductFrame>
}
