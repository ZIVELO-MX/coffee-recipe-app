"use client"

import { Bookmark, Clock, Heart } from "lucide-react"
import Link from "next/link"
import { AppearanceAvatar } from "./appearance-avatar"
import { useRecipeOverlay } from "./product-frame"
import { METHOD_LABEL, type RecipeView } from "@/lib/domain"
import { mmss, ratio, totalSeconds } from "@/lib/format"

export function RecipeCard({
  recipe,
  index = 0,
  saved = recipe.viewer_saved,
}: {
  recipe: RecipeView
  index?: number
  saved?: boolean
}) {
  const openRecipe = useRecipeOverlay()
  return (
    <Link
      href={`/recipes/${recipe._id}`}
      scroll={false}
      data-recipe-id={recipe._id}
      onClick={(event) => {
        event.preventDefault()
        openRecipe(recipe)
      }}
      style={{ animationDelay: `${index * 90}ms` }}
      className="group animate-rise relative flex w-full flex-col overflow-hidden rounded-3xl border border-border bg-card text-left transition-[border-color,box-shadow] duration-300 hover:border-primary/30 hover:shadow-2xl active:scale-[0.98]"
    >
      <div className="flex items-start gap-4 p-5 pb-4">
        <AppearanceAvatar appearance={recipe.appearance} size="md" className="transition-transform duration-300 group-hover:scale-[1.04]" />
        <div className="min-w-0 flex-1 pt-0.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {METHOD_LABEL[recipe.method]}
          </span>
          <h3 className="font-serif text-lg font-bold leading-tight text-foreground text-balance">
            {recipe.name}
          </h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">{recipe.author}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
          <Bookmark className={saved ? "size-4 fill-primary text-primary" : "size-4"} aria-hidden="true" />
        </span>
      </div>

      <div className="flex items-center gap-3 border-t border-border px-5 py-4 font-mono text-xs text-muted-foreground">
          <span className="text-primary">{ratio(recipe)}</span>
          <span aria-hidden="true">·</span>
          <span>{recipe.coffee_g} g</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {mmss(totalSeconds(recipe))}
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" aria-hidden="true" />
            {recipe.like_count}
          </span>
      </div>
    </Link>
  )
}
