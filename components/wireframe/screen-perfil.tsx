"use client"

import { ChevronRight, LogIn, LogOut, Settings2 } from "lucide-react"
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import Image from "next/image"
import { getAvatar } from "@/lib/avatars"
import type { ViewerUser } from "@/lib/domain"

export function ScreenPerfil({
  user,
  grinder,
  tempUnit,
  onOpenGrinder,
  onToggleUnit,
  onLogout,
}: {
  user: ViewerUser
  grinder: string
  tempUnit: "C" | "F"
  onOpenGrinder: () => void
  onToggleUnit: (unit: "C" | "F") => void
  onLogout: () => void
}) {
  const avatar = getAvatar(user.avatarId)

  return (
    <div className="flex flex-col gap-7 px-4 pb-32 pt-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="relative glow-accent h-20 w-20 overflow-hidden rounded-full border-2 border-primary/40">
          <Image
            src={avatar.src || "/icon.svg"}
            alt={`Avatar ${avatar.label}`}
            fill
            sizes="80px"
            className="h-full w-full object-cover"
          />
        </div>
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
