"use client"

import { useAuth, useClerk } from "@clerk/nextjs"
import { useEffect, useState, useTransition } from "react"
import { updatePreferences } from "@/app/actions"
import type { UserPreferences, ViewerUser } from "@/lib/domain"
import { GrinderSelector, type GrinderOption } from "./grinder-selector"
import { ScreenPerfil } from "./screen-perfil"

const PREFERENCES_KEY = "coffee-recipe-guest-preferences"

export function ProfileClient({ user, initialPreferences }: { user: ViewerUser; initialPreferences: UserPreferences }) {
  const { isSignedIn } = useAuth()
  const { signOut } = useClerk()
  const [preferences, setPreferences] = useState(initialPreferences)
  const [grinderOpen, setGrinderOpen] = useState(false)
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

  function persist(next: UserPreferences) {
    setPreferences(next)
    if (!isSignedIn) {
      sessionStorage.setItem(PREFERENCES_KEY, JSON.stringify(next))
      return
    }
    startTransition(async () => {
      const result = await updatePreferences(next)
      setMessage(result.ok ? "Preferencias guardadas." : result.error.message)
    })
  }

  function selectGrinder(grinder: GrinderOption) {
    persist({ ...preferences, default_grinder_slug: grinder.slug, default_grinder_name: grinder.name })
  }

  return (
    <>
      <ScreenPerfil
        user={user}
        grinder={preferences.default_grinder_name}
        tempUnit={preferences.temperature_unit}
        onOpenGrinder={() => setGrinderOpen(true)}
        onToggleUnit={(temperature_unit) => persist({ ...preferences, temperature_unit })}
        onLogout={() => void signOut({ redirectUrl: "/recipes" })}
      />
      {message && <p role="status" className="mx-4 -mt-28 rounded-2xl border border-border bg-card p-3 text-center text-xs text-muted-foreground">{message}</p>}
      {grinderOpen && <GrinderSelector selected={preferences.default_grinder_slug} onSelect={selectGrinder} onClose={() => setGrinderOpen(false)} />}
    </>
  )
}
