"use client"

import { SignInButton } from "@clerk/nextjs"
import type { RecipeView } from "@/lib/domain"
import { RecipeCard } from "./recipe-card"

export function ScreenGuardados({
  recipes,
  signedIn,
}: {
  recipes: RecipeView[]
  signedIn: boolean
}) {
  return (
    <div className="flex flex-col gap-5 px-4 pb-32 pt-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-primary">Tu colección</p>
        <h1 className="font-serif text-3xl font-extrabold text-foreground">Guardados</h1>
        <p className="text-sm text-muted-foreground">{recipes.length} recetas</p>
      </header>

      <div className="flex flex-col gap-4">
        {!signedIn ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">Inicia sesión para ver tu colección.</p>
            <SignInButton mode="modal">
              <button type="button" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Iniciar sesión</button>
            </SignInButton>
          </div>
        ) : recipes.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Aún no has guardado recetas</p>
        ) : (
          recipes.map((recipe, index) => <RecipeCard key={recipe._id} recipe={recipe} index={index} />)
        )}
      </div>
    </div>
  )
}
