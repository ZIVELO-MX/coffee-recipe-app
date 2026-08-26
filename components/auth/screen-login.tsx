"use client"

import { useState } from "react"
import { ArrowLeft, Coffee, Lock, Mail } from "lucide-react"
import { AuthField } from "./auth-field"
import { SocialButtons } from "./social-buttons"

export function ScreenLogin({
  onLogin,
  onGoRegister,
  onGoForgot,
  onGuest,
}: {
  onLogin: (email: string) => void
  onGoRegister: () => void
  onGoForgot: () => void
  onGuest: () => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const valid = email.includes("@") && password.length >= 4

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (valid) onLogin(email)
  }

  return (
    <div className="flex min-h-full flex-col gap-8 px-6 pb-12 pt-6">
      <button
        type="button"
        onClick={onGuest}
        className="flex w-fit items-center gap-2 rounded-full px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a buscar
      </button>

      <header className="animate-rise flex flex-col items-center gap-4 text-center">
        <div className="glow-accent flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
          <Coffee className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl font-extrabold text-foreground text-balance">
            Bienvenido de vuelta
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Inicia sesión para ver tus recetas guardadas
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="animate-rise flex flex-col gap-4"
        style={{ animationDelay: "80ms" }}
      >
        <AuthField
          id="login-email"
          label="Correo electrónico"
          type="email"
          icon={Mail}
          value={email}
          onChange={setEmail}
          placeholder="tu@correo.com"
          autoComplete="email"
        />
        <AuthField
          id="login-password"
          label="Contraseña"
          type="password"
          icon={Lock}
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        <button
          type="button"
          onClick={onGoForgot}
          className="-mt-1 self-end text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          ¿Olvidaste tu contraseña?
        </button>

        <button
          type="submit"
          disabled={!valid}
          className="mt-1 rounded-full bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40"
        >
          Iniciar sesión
        </button>
      </form>

      <div className="animate-rise flex flex-col gap-4" style={{ animationDelay: "160ms" }}>
        <SocialButtons action="Iniciar sesión" />
      </div>

      <p className="mt-auto text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <button
          type="button"
          onClick={onGoRegister}
          className="font-semibold text-primary transition-opacity hover:opacity-80"
        >
          Regístrate
        </button>
      </p>
    </div>
  )
}
