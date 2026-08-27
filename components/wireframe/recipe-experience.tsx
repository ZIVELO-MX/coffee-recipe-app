"use client"

import { useAuth, useClerk } from "@clerk/nextjs"
import { useEffect, useOptimistic, useState, useTransition, type RefObject } from "react"
import { setRecipeLiked, setRecipeSaved, updatePreferences } from "@/app/actions"
import type { RecipeView, UserPreferences } from "@/lib/domain"
import { GrinderSelector, type GrinderOption } from "./grinder-selector"
import { ScreenRecipe } from "./screen-recipe"

const INTENT_KEY = "coffee-recipe-pending-intent"
const PREFERENCES_KEY = "coffee-recipe-guest-preferences"
type PendingIntent = { recipeId: string; kind: "saved" | "liked"; value: boolean }

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
  const [grindSetting, setGrindSetting] = useState("Molienda recomendada")
  const [message, setMessage] = useState("")
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (isSignedIn) return
    const raw = sessionStorage.getItem(PREFERENCES_KEY)
    if (!raw) return
    try {
      const stored = JSON.parse(raw) as UserPreferences
      if ((stored.temperature_unit === "C" || stored.temperature_unit === "F") && /^[a-z0-9-]+$/.test(stored.default_grinder_slug)) {
        const timeout = window.setTimeout(() => setPreferences(stored), 0)
        return () => window.clearTimeout(timeout)
      }
    } catch {
      sessionStorage.removeItem(PREFERENCES_KEY)
    }
  }, [isSignedIn])

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/grinders/${preferences.default_grinder_slug}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("chart unavailable")))
      .then((chart: { methods: { key: string; setting: string }[] }) => {
        const method = chart.methods.find((item) => item.key === recipe.grind.target)
        setGrindSetting(method?.setting ?? "Molienda recomendada")
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setGrindSetting("Molienda recomendada")
      })
    return () => controller.abort()
  }, [preferences.default_grinder_slug, recipe.grind.target])

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
    const raw = sessionStorage.getItem(INTENT_KEY)
    if (!raw) return
    sessionStorage.removeItem(INTENT_KEY)
    try {
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
      sessionStorage.setItem(PREFERENCES_KEY, JSON.stringify(next))
      return
    }
    startTransition(async () => {
      const result = await updatePreferences(next)
      if (!result.ok) setMessage(result.error.message)
    })
  }

  function selectGrinder(grinder: GrinderOption) {
    savePreferences({ ...preferences, default_grinder_slug: grinder.slug, default_grinder_name: grinder.name })
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
        grinderName={preferences.default_grinder_name}
        grindSetting={grindSetting}
        onTimerStatusChange={(status) => {
          onTimerStatusChange(status)
        }}
        onRequestClose={onRequestClose}
      />
      {message && <p role="status" className="fixed inset-x-4 bottom-28 z-50 mx-auto max-w-sm rounded-2xl bg-destructive px-4 py-3 text-center text-sm text-destructive-foreground shadow-xl">{message}</p>}
      {grinderOpen && <GrinderSelector selected={preferences.default_grinder_slug} onSelect={selectGrinder} onClose={() => setGrinderOpen(false)} />}
    </>
  )
}
