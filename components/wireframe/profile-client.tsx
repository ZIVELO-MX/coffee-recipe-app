"use client"

import { useAuth, useClerk } from "@clerk/nextjs"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
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
  authConfigured,
}: {
  user: ViewerUser
  initialPreferences: UserPreferences
  initialApiKeyStatus: ApiKeyStatus
  authConfigured: boolean
}) {
  const { isSignedIn } = useAuth()
  const { openSignIn, openSignUp, signOut } = useClerk()
  const [preferences, setPreferences] = useState(initialPreferences)
  const [grinderOpen, setGrinderOpen] = useState(false)
  const [apiKeyOpen, setApiKeyOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState(initialApiKeyStatus)
  const [message, setMessage] = useState("")
  const [avatarError, setAvatarError] = useState("")
  const [accountError, setAccountError] = useState("")
  const [accountAction, setAccountAction] = useState<"signIn" | "signUp" | "signOut" | null>(null)
  const accountTimeoutRef = useRef<number | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => () => {
    if (accountTimeoutRef.current) window.clearTimeout(accountTimeoutRef.current)
  }, [])

  const clearAuthAction = useCallback(() => {
    if (accountTimeoutRef.current) window.clearTimeout(accountTimeoutRef.current)
    accountTimeoutRef.current = null
    setAccountAction(null)
  }, [])

  useEffect(() => {
    if (accountAction !== "signIn" && accountAction !== "signUp") return
    function handleClerkDismiss(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Element)) return
      // Clerk keeps its modal content in a portal. A pointer event outside any
      // dialog is the light-dismiss gesture, including clicking the backdrop.
      if (!target.closest('[role="dialog"]')) clearAuthAction()
    }
    document.addEventListener("pointerdown", handleClerkDismiss, true)
    return () => document.removeEventListener("pointerdown", handleClerkDismiss, true)
  }, [accountAction, clearAuthAction])

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
    setAvatarError("")
    startTransition(async () => {
      const result = await updateAvatar(avatar)
      if (result.ok) {
        setPreferences((current) => ({ ...current, avatar: result.data }))
        setAvatarOpen(false)
        setMessage("Avatar guardado.")
      } else {
        setAvatarError(result.error.message)
      }
    })
  }

  async function openAccountFlow(flow: "signIn" | "signUp") {
    setAccountError("")
    if (!authConfigured) {
      setAccountError("El inicio de sesión no está disponible en este preview porque Clerk no está configurado.")
      return
    }
    setAccountAction(flow)
    if (accountTimeoutRef.current) window.clearTimeout(accountTimeoutRef.current)
    try {
      // Let the pending state paint before Clerk initializes its modal.
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
      accountTimeoutRef.current = window.setTimeout(() => {
        accountTimeoutRef.current = null
        setAccountAction(null)
        setAccountError("No se pudo abrir la autenticación. Verifica que Clerk esté configurado en este preview.")
      }, 8000)
      if (flow === "signIn") await openSignIn({ fallbackRedirectUrl: "/recipes" })
      else await openSignUp({ fallbackRedirectUrl: "/recipes" })
    } catch {
      if (accountTimeoutRef.current) window.clearTimeout(accountTimeoutRef.current)
      accountTimeoutRef.current = null
      setAccountAction(null)
      setAccountError("La autenticación no está disponible en este entorno. Intenta más tarde o usa un entorno con Clerk configurado.")
    }
  }

  async function handleSignOut() {
    setAccountError("")
    setAccountAction("signOut")
    try {
      await signOut({ redirectUrl: "/recipes" })
    } catch {
      setAccountError("No se pudo cerrar la sesión. Intenta de nuevo.")
    } finally {
      setAccountAction(null)
    }
  }

  function handleAuthTriggerFocus() {
    if (accountAction !== "signIn" && accountAction !== "signUp") return
    clearAuthAction()
  }

  return (
    <>
      <ScreenPerfil
        user={user}
        avatar={preferences.avatar}
        grinder={preferences.default_grinder_name ?? `Molino #${preferences.default_grinder_id}`}
        tempUnit={preferences.temperature_unit}
        onOpenGrinder={() => setGrinderOpen(true)}
        onOpenAvatar={() => { setAvatarError(""); setAvatarOpen(true) }}
        onToggleUnit={(temperature_unit) => persist({ ...preferences, temperature_unit })}
        apiKeyStatus={apiKeyStatus}
        pending={pending}
        onOpenApiKey={() => setApiKeyOpen(true)}
        accountError={accountError}
        accountAction={accountAction}
        authConfigured={authConfigured}
        onAuthTriggerFocus={handleAuthTriggerFocus}
        onSignIn={() => void openAccountFlow("signIn")}
        onSignUp={() => void openAccountFlow("signUp")}
        onLogout={() => void handleSignOut()}
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
              error={avatarError}
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
