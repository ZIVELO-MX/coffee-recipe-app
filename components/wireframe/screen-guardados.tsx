"use client"

import { RECIPES } from "@/lib/mock-data"
import { RecipeCard } from "./recipe-card"

export function ScreenGuardados({
  onOpen,
  savedIds = RECIPES.filter((r) => r.saved).map((r) => r._id),
}: {
  onOpen: (id: string) => void
  savedIds?: string[]
}) {
  const saved = RECIPES.filter((r) => savedIds.includes(r._id))

  return (
    <div className="flex flex-col gap-5 px-4 pb-32 pt-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-primary">Tu colección</p>
        <h1 className="font-serif text-3xl font-extrabold text-foreground">Guardados</h1>
        <p className="text-sm text-muted-foreground">{saved.length} recetas</p>
      </header>

      <div className="flex flex-col gap-4">
        {saved.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Aún no has guardado recetas
          </p>
        ) : (
          saved.map((r, i) => <RecipeCard key={r._id} recipe={r} onOpen={onOpen} index={i} />)
        )}
      </div>
    </div>
  )
}
