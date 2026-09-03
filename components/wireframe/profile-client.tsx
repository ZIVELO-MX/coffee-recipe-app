"use client"

import { useAuth, useClerk } from "@clerk/nextjs"
import { useEffect, useState, useTransition } from "react"
import { updatePreferences } from "@/app/actions"
import type { ApiKeyStatus, UserPreferences, ViewerUser } from "@/lib/domain"
import { ApiKeyDialog } from "./api-key-dialog"
import { GrinderSelector, type GrinderOption } from "./grinder-selector"
import { ScreenPerfil } from "./screen-perfil"

const PREFERENCES_KEY = "coffee-recipe-guest-preferences:v2"

export function ProfileClient({
  user,
  initialPreferences,
  initialApiKeyStatus,
}: {
  user: ViewerUser
  initialPreferences: UserPreferences
  initialApiKeyStatus: ApiKeyStatus
}) {
  const { isSignedIn } = useAuth()
  const { signOut } = useClerk()
  const [preferences, setPreferences] = useState(initialPreferences)
  const [grinderOpen, setGrinderOpen] = useState(false)
  const [apiKeyOpen, setApiKeyOpen] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState(initialApiKeyStatus)
  const [message, setMessage] = useState("")
  const [, startTransition] = useTransition()

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

  function persist(next: UserPreferences) {
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
      setMessage(result.ok ? "Preferencias guardadas." : result.error.message)
    })
  }

  function selectGrinder(grinder: GrinderOption) {
    persist({ ...preferences, default_grinder_id: grinder.id, default_grinder_name: `${grinder.brand} ${grinder.name}` })
  }

  return (
    <>
      <ScreenPerfil
        user={user}
        grinder={preferences.default_grinder_name ?? `Molino #${preferences.default_grinder_id}`}
        tempUnit={preferences.temperature_unit}
        onOpenGrinder={() => setGrinderOpen(true)}
        onToggleUnit={(temperature_unit) => persist({ ...preferences, temperature_unit })}
        apiKeyStatus={apiKeyStatus}
        onOpenApiKey={() => setApiKeyOpen(true)}
        onLogout={() => void signOut({ redirectUrl: "/recipes" })}
      />
      {message && <p role="status" className="mx-4 -mt-28 rounded-2xl border border-border bg-card p-3 text-center text-xs text-muted-foreground">{message}</p>}
      {grinderOpen && <GrinderSelector selected={preferences.default_grinder_id} onSelect={selectGrinder} onClose={() => setGrinderOpen(false)} />}
      {!user.guest && (
        <ApiKeyDialog
          open={apiKeyOpen}
          onOpenChange={setApiKeyOpen}
          status={apiKeyStatus}
          onStatusChange={setApiKeyStatus}
        />
      )}
    </>
  )
}
