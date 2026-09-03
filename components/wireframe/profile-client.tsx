"use client"

import { useAuth, useClerk } from "@clerk/nextjs"
import { useEffect, useState, useTransition } from "react"
import { updateAvatar, updatePreferences } from "@/app/actions"
import type { ApiKeyStatus, Appearance, UserPreferences, ViewerUser } from "@/lib/domain"
import { ApiKeyDialog } from "./api-key-dialog"
import { AvatarPickerDialog } from "./avatar-picker-dialog"
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
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState(initialApiKeyStatus)
  const [message, setMessage] = useState("")
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (isSignedIn) return
    try {
      const raw = sessionStorage.getItem(PREFERENCES_KEY)
      if (!raw) return
      const stored = JSON.parse(raw) as Partial<UserPreferences>
      const storedGrinderId = stored.default_grinder_id
      if ((stored.temperature_unit === "C" || stored.temperature_unit === "F") && typeof storedGrinderId === "number" && Number.isSafeInteger(storedGrinderId) && storedGrinderId > 0) {
        const timeout = window.setTimeout(() => setPreferences((current) => ({
          ...current,
          temperature_unit: stored.temperature_unit!,
          default_grinder_id: storedGrinderId,
          default_grinder_name: null,
        })), 0)
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

  function saveAvatar(avatar: Appearance) {
    startTransition(async () => {
      const result = await updateAvatar(avatar)
      if (result.ok) {
        setPreferences((current) => ({ ...current, avatar: result.data }))
        setAvatarOpen(false)
        setMessage("Avatar guardado.")
      } else {
        setMessage(result.error.message)
      }
    })
  }

  return (
    <>
      <ScreenPerfil
        user={user}
        avatar={preferences.avatar}
        grinder={preferences.default_grinder_name ?? `Molino #${preferences.default_grinder_id}`}
        tempUnit={preferences.temperature_unit}
        onOpenGrinder={() => setGrinderOpen(true)}
        onOpenAvatar={() => setAvatarOpen(true)}
        onToggleUnit={(temperature_unit) => persist({ ...preferences, temperature_unit })}
        apiKeyStatus={apiKeyStatus}
        onOpenApiKey={() => setApiKeyOpen(true)}
        onLogout={() => void signOut({ redirectUrl: "/recipes" })}
      />
      {message && <p role="status" className="mx-4 -mt-28 rounded-2xl border border-border bg-card p-3 text-center text-xs text-muted-foreground">{message}</p>}
      {grinderOpen && <GrinderSelector selected={preferences.default_grinder_id} onSelect={selectGrinder} onClose={() => setGrinderOpen(false)} />}
      {!user.guest && (
        <>
          {avatarOpen && (
            <AvatarPickerDialog
              open
              onOpenChange={setAvatarOpen}
              value={preferences.avatar}
              onSave={saveAvatar}
              pending={pending}
            />
          )}
          <ApiKeyDialog
            open={apiKeyOpen}
            onOpenChange={setApiKeyOpen}
            status={apiKeyStatus}
            onStatusChange={setApiKeyStatus}
          />
        </>
      )}
    </>
  )
}
