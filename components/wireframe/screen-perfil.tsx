"use client"

import { ChevronRight, Code2, KeyRound, LogIn, LogOut, Settings2 } from "lucide-react"
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { AppearanceAvatar } from "./appearance-avatar"
import type { ApiKeyStatus, Appearance, ViewerUser } from "@/lib/domain"
import { InstallApp } from "@/components/pwa/install-app"

export function ScreenPerfil({
  user,
  avatar,
  grinder,
  tempUnit,
  onOpenGrinder,
  onOpenAvatar,
  onToggleUnit,
  apiKeyStatus,
  onOpenApiKey,
  onLogout,
}: {
  user: ViewerUser
  avatar: Appearance
  grinder: string
  tempUnit: "C" | "F"
  onOpenGrinder: () => void
  onOpenAvatar: () => void
  onToggleUnit: (unit: "C" | "F") => void
  apiKeyStatus: ApiKeyStatus
  onOpenApiKey: () => void
  onLogout: () => void
}) {
  return (
    <div className="flex flex-col gap-7 px-4 pb-32 pt-8">
      <header className="flex flex-col items-center gap-3 text-center">
        {user.guest ? (
          <AppearanceAvatar appearance={avatar} size="lg" className="glow-accent size-20" />
        ) : (
          <button
            type="button"
            onClick={onOpenAvatar}
            aria-label="Cambiar avatar"
            className="group relative rounded-full outline-none transition-transform active:scale-[0.97] focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <AppearanceAvatar appearance={avatar} size="lg" className="glow-accent size-20 transition-transform group-hover:scale-[1.03]" />
          </button>
        )}
        <div>
          <h1 className="font-serif text-2xl font-extrabold text-foreground">{user.name}</h1>
          <p className="text-sm text-muted-foreground">
            {user.guest ? "Estás explorando sin cuenta" : user.email}
          </p>
        </div>
      </header>

      {/* Preferencias */}
      <section className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Settings2 className="h-4 w-4" aria-hidden="true" />
          Preferencias
        </p>

        <div className="flex flex-col gap-px overflow-hidden rounded-3xl border border-border bg-card">
          <button
            type="button"
            onClick={onOpenGrinder}
            className="flex items-center justify-between px-4 pt-5 pb-4 text-left transition-colors hover:bg-secondary/50"
          >
            <span className="text-sm text-foreground">Molino</span>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              {grinder}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>

          <div className="h-px bg-border" />

          <button
            type="button"
            onClick={() => onToggleUnit(tempUnit === "C" ? "F" : "C")}
            aria-label={`Temperatura en grados ${tempUnit === "C" ? "Celsius" : "Fahrenheit"}, pulsa para cambiar`}
            className="flex w-full items-center justify-between px-4 pt-4 pb-5 text-left transition-colors hover:bg-secondary/50"
          >
            <span className="text-sm text-foreground">Temperatura</span>
            <div className="flex rounded-full bg-secondary p-0.5" aria-hidden="true">
              {(["C", "F"] as const).map((u) => (
                <span
                  key={u}
                  className={`rounded-full px-3.5 py-1 text-sm transition-colors ${
                    tempUnit === u
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  °{u}
                </span>
              ))}
            </div>
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Aplicación</p>
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <InstallApp />
        </div>
      </section>

      {!user.guest && (
        <section className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Code2 className="size-4" aria-hidden="true" />
            Desarrolladores
          </p>
          <button
            type="button"
            onClick={onOpenApiKey}
            className="flex w-full items-center justify-between gap-3 rounded-3xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/50"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                <KeyRound className="size-5" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">API key</span>
                <span className="text-xs text-muted-foreground">Crear recetas desde la API</span>
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              {apiKeyStatus.has_key ? `•••• ${apiKeyStatus.last_four}` : "Sin configurar"}
              <ChevronRight className="size-4" aria-hidden="true" />
            </span>
          </button>
        </section>
      )}

      {/* Cuenta */}
      <section className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Cuenta</p>
        {user.guest ? (
          <div className="flex gap-2">
            <SignInButton mode="modal">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Iniciar sesión
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="flex-1 rounded-full border border-border bg-card px-4 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/50 active:scale-[0.98]"
              >
                Crear cuenta
              </button>
            </SignUpButton>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-card p-4">
            <UserButton />
            <button
              type="button"
              onClick={onLogout}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/50 active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
