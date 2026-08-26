"use client"

import { useRouter } from "next/navigation"
import type { RecipeView, UserPreferences } from "@/lib/domain"
import { RecipeSheet } from "./recipe-sheet"

export function RecipeModalRoute({ recipe, preferences }: { recipe: RecipeView; preferences: UserPreferences }) {
  const router = useRouter()
  return <RecipeSheet recipe={recipe} preferences={preferences} onClose={() => router.back()} />
}
