"use client"

import { Bookmark, Clock, Heart } from "lucide-react"
import Image from "next/image"
import { METHOD_LABEL, type Recipe } from "@/lib/mock-data"
import { mmss, ratio, totalSeconds } from "@/lib/format"

export function RecipeCard({
  recipe,
  onOpen,
  index = 0,
  saved = recipe.saved,
}: {
  recipe: Recipe
  onOpen: (id: string) => void
  index?: number
  saved?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(recipe._id)}
      style={{ animationDelay: `${index * 90}ms` }}
      className="group animate-rise relative flex w-full flex-col overflow-hidden rounded-3xl border border-border bg-card text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl active:scale-[0.98]"
    >
      {/* Imagen con degradado para legibilidad */}
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={recipe.image || "/icon.svg"}
          alt={`Café preparado con método ${METHOD_LABEL[recipe.method]}`}
          fill
          sizes="(max-width: 400px) 100vw, 400px"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

        {/* Chip de método (glass) */}
        <span className="glass absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium text-foreground">
          {METHOD_LABEL[recipe.method]}
        </span>

        {/* Guardar */}
        <span className="glass absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-foreground">
          <Bookmark
            className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`}
            aria-hidden="true"
          />
        </span>
      </div>

      <div className="flex flex-col gap-4 p-5 pt-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-lg font-bold leading-tight text-foreground text-balance">
            {recipe.name}
          </h3>
          <p className="text-sm text-muted-foreground">{recipe.author}</p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
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
            {recipe.likes}
          </span>
        </div>
      </div>
    </button>
  )
}
