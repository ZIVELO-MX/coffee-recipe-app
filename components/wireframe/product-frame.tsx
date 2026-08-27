"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { RecipeView, UserPreferences } from "@/lib/domain"
import { BottomNav, type Tab } from "./bottom-nav"
import { RecipeSheet } from "./recipe-sheet"

const DEFAULT_PREFERENCES: UserPreferences = { temperature_unit: "C", default_grinder_slug: "timemore-c3", default_grinder_name: "Timemore C3" }
const RecipeOverlayContext = createContext<((recipe: RecipeView) => void) | null>(null)

export function useRecipeOverlay() {
  const open = useContext(RecipeOverlayContext)
  if (!open) throw new Error("useRecipeOverlay must be used inside ProductFrame")
  return open
}

function tabForPath(pathname: string): Tab {
  if (pathname.startsWith("/saved")) return "guardados"
  if (pathname.startsWith("/profile")) return "perfil"
  return "buscar"
}

export function ProductFrame({ children, recipeSlot, initialPreferences = DEFAULT_PREFERENCES }: { children: ReactNode; recipeSlot?: ReactNode; initialPreferences?: UserPreferences }) {
  const pathname = usePathname()
  const active = tabForPath(pathname)
  const viewportRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<Tab>(active)
  const scrollPositions = useRef<Record<Tab, number>>({ guardados: 0, buscar: 0, perfil: 0 })
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeView | null>(null)

  useEffect(() => {
    const viewport = viewportRef.current
    const previous = activeTabRef.current
    if (!viewport || previous === active) return
    scrollPositions.current[previous] = viewport.scrollTop
    activeTabRef.current = active
    requestAnimationFrame(() => {
      viewport.scrollTop = scrollPositions.current[active]
    })
  }, [active])

  return (
    <RecipeOverlayContext.Provider value={setSelectedRecipe}>
      <main className="flex min-h-screen justify-center bg-background">
        <div className="relative flex h-[100dvh] w-full max-w-[400px] flex-col overflow-hidden bg-background sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-[2.5rem] sm:border sm:border-border sm:shadow-2xl">
          <div ref={viewportRef} data-product-scroll className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
          <BottomNav active={active} />
        </div>
      </main>
      {recipeSlot}
      {selectedRecipe && <RecipeSheet recipe={selectedRecipe} preferences={initialPreferences} onClose={() => setSelectedRecipe(null)} />}
    </RecipeOverlayContext.Provider>
  )
}
