"use client"

import { useRouter } from "next/navigation"
import type { RecipeView, UserPreferences } from "@/lib/domain"
import { RecipeSheet } from "./recipe-sheet"

export function RecipeModalRoute({ recipe, preferences, direct = false }: { recipe: RecipeView; preferences: UserPreferences; direct?: boolean }) {
  const router = useRouter()
  return <RecipeSheet recipe={recipe} preferences={preferences} onClose={() => direct ? router.replace("/recipes") : router.back()} />
}
