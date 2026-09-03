"use client"

import { useAuth, useClerk } from "@clerk/nextjs"
import { useEffect, useOptimistic, useState, useTransition, type RefObject } from "react"
import { setRecipeLiked, setRecipeSaved, updatePreferences } from "@/app/actions"
import type { GrindSettingView, RecipeView, UserPreferences } from "@/lib/domain"
import { GrinderSelector, type GrinderOption } from "./grinder-selector"
import { ScreenRecipe } from "./screen-recipe"

const INTENT_KEY = "coffee-recipe-pending-intent"
const PREFERENCES_KEY = "coffee-recipe-guest-preferences:v2"
type PendingIntent = { recipeId: string; kind: "saved" | "liked"; value: boolean }

function formatGrindSetting(grind: GrindSettingView): string {
  if (grind.setting_unit === "CLICKS") return `${grind.setting} clicks`
  if (grind.setting_unit === "ROTATIONS") return `${grind.setting} vueltas`
  return String(grind.setting)
}

export type TimerStatus = "idle" | "running" | "paused" | "completed"

export function RecipeExperience({ recipe, initialPreferences, timerStatus, scrollContainerRef, onTimerStatusChange, onRequestClose }: {
  recipe: RecipeView
  initialPreferences: UserPreferences
  timerStatus: TimerStatus
  scrollContainerRef: RefObject<HTMLDivElement | null>
  onTimerStatusChange: (status: TimerStatus) => void
  onRequestClose: () => void
}) {
  const { isSignedIn } = useAuth()
  const { openSignIn } = useClerk()
  const [saved, setSaved] = useState(recipe.viewer_saved)
  const [liked, setLiked] = useState(recipe.viewer_liked)
  const [likeCount, setLikeCount] = useState(recipe.like_count)
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved, (_, value: boolean) => value)
  const [optimisticLike, setOptimisticLike] = useOptimistic({ liked, count: likeCount }, (_, value: { liked: boolean; count: number }) => value)
  const [preferences, setPreferences] = useState(initialPreferences)
  const [grinderOpen, setGrinderOpen] = useState(false)
  const [fetchedGrind, setFetchedGrind] = useState<GrindSettingView | null>(null)
  const [message, setMessage] = useState("")
  const [, startTransition] = useTransition()
  const recipeGrind = recipe.grind.converted?.grinder_id === preferences.default_grinder_id
    ? recipe.grind.converted
    : recipe.grind.source.grinder_id === preferences.default_grinder_id
      ? recipe.grind.source
      : null
  const displayGrind = fetchedGrind?.grinder_id === preferences.default_grinder_id
    ? fetchedGrind
    : recipeGrind ?? recipe.grind.source

  useEffect(() => {
    if (isSignedIn) return
    try {
      const raw = sessionStorage.getItem(PREFERENCES_KEY)
      if (!raw) return
      const stored = JSON.parse(raw) as UserPreferences
      if ((stored.temperature_unit === "C" || stored.temperature_unit === "F") && Number.isSafeInteger(stored.default_grinder_id) && stored.default_grinder_id > 0) {
        const timeout = window.setTimeout(() => setPreferences({ ...stored, default_grinder_name: null }), 0)
        return () => window.clearTimeout(timeout)
      }
    } catch {
      sessionStorage.removeItem(PREFERENCES_KEY)
    }
  }, [isSignedIn])

  useEffect(() => {
    const initialConverted = recipe.grind.converted
    if (initialConverted?.grinder_id === preferences.default_grinder_id) return
    if (recipe.grind.source.grinder_id === preferences.default_grinder_id) return
    const controller = new AbortController()
    fetch(`/api/recipes/${recipe._id}?grinder=${preferences.default_grinder_id}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("conversion unavailable")))
      .then((convertedRecipe: RecipeView) => {
        const grind = convertedRecipe.grind.converted ?? convertedRecipe.grind.source
        setFetchedGrind(grind)
        setPreferences((current) => current.default_grinder_id === grind.grinder_id
          ? { ...current, default_grinder_name: grind.grinder_name }
          : current)
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setMessage("No se pudo convertir la molienda; se muestra la original.")
      })
    return () => controller.abort()
  }, [preferences.default_grinder_id, recipe._id, recipe.grind.converted, recipe.grind.source])

  function persist(intent: PendingIntent) {
    startTransition(async () => {
      setMessage("")
      if (intent.kind === "saved") {
        setOptimisticSaved(intent.value)
        const result = await setRecipeSaved(recipe._id, intent.value)
        if (result.ok) setSaved(result.data.saved)
        else setMessage(result.error.message)
      } else {
        const optimisticCount = Math.max(0, likeCount + (intent.value === liked ? 0 : intent.value ? 1 : -1))
        setOptimisticLike({ liked: intent.value, count: optimisticCount })
        const result = await setRecipeLiked(recipe._id, intent.value)
        if (result.ok) {
          setLiked(result.data.liked)
          setLikeCount(result.data.likeCount)
        } else setMessage(result.error.message)
      }
    })
  }

  function request(intent: PendingIntent) {
    if (!isSignedIn) {
      sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent))
      void openSignIn()
      return
    }
    persist(intent)
  }

  useEffect(() => {
    if (!isSignedIn) return
    try {
      const raw = sessionStorage.getItem(INTENT_KEY)
      if (!raw) return
      sessionStorage.removeItem(INTENT_KEY)
      const intent = JSON.parse(raw) as PendingIntent
      if (intent.recipeId === recipe._id && (intent.kind === "saved" || intent.kind === "liked") && typeof intent.value === "boolean") persist(intent)
    } catch {
      // Ignore invalid or stale browser state.
    }
  // persist intentionally uses the latest recipe state after authentication.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, recipe._id])

  function savePreferences(next: UserPreferences) {
    setPreferences(next)
    if (!isSignedIn) {
      try {
        sessionStorage.setItem(PREFERENCES_KEY, JSON.stringify({
          temperature_unit: next.temperature_unit,
          default_grinder_id: next.default_grinder_id,
        }))
      } catch {
        setMessage("No se pudieron guardar las preferencias en este navegador.")
      }
      return
    }
    startTransition(async () => {
      const result = await updatePreferences(next)
      if (result.ok) setPreferences(result.data)
      else setMessage(result.error.message)
    })
  }

  function selectGrinder(grinder: GrinderOption) {
    savePreferences({ ...preferences, default_grinder_id: grinder.id, default_grinder_name: `${grinder.brand} ${grinder.name}` })
  }

  return (
    <>
      <ScreenRecipe
        recipe={recipe}
        timerStatus={timerStatus}
        scrollContainerRef={scrollContainerRef}
        tempUnit={preferences.temperature_unit}
        onToggleUnit={(temperature_unit) => savePreferences({ ...preferences, temperature_unit })}
        onOpenGrinder={() => setGrinderOpen(true)}
        saved={optimisticSaved}
        onToggleSaved={() => request({ recipeId: recipe._id, kind: "saved", value: !optimisticSaved })}
        liked={optimisticLike.liked}
        likeCount={optimisticLike.count}
        onToggleLiked={() => request({ recipeId: recipe._id, kind: "liked", value: !optimisticLike.liked })}
        grinderName={displayGrind.grinder_name ?? preferences.default_grinder_name ?? `Molino #${displayGrind.grinder_id}`}
        grindSetting={formatGrindSetting(displayGrind)}
        onTimerStatusChange={(status) => {
          onTimerStatusChange(status)
        }}
        onRequestClose={onRequestClose}
      />
      {message && <p role="status" className="fixed inset-x-4 bottom-28 z-50 mx-auto max-w-sm rounded-2xl bg-destructive px-4 py-3 text-center text-sm text-destructive-foreground shadow-xl">{message}</p>}
      {grinderOpen && <GrinderSelector selected={preferences.default_grinder_id} onSelect={selectGrinder} onClose={() => setGrinderOpen(false)} />}
    </>
  )
}
