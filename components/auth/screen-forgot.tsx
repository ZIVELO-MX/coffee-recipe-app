"use client"

import { useState } from "react"
import { ArrowLeft, MailCheck, Mail } from "lucide-react"
import { AuthField } from "./auth-field"

export function ScreenForgot({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  const valid = email.includes("@")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (valid) setSent(true)
  }

  return (
    <div className="flex min-h-full flex-col gap-7 px-6 pb-12 pt-14">
      <button
        type="button"
        onClick={onBack}
        aria-label="Volver a iniciar sesión"
        className="glass flex h-10 w-10 items-center justify-center rounded-full text-foreground"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>

      {sent ? (
        <div className="animate-rise flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div className="glow-accent flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
            <MailCheck className="h-8 w-8" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="font-serif text-2xl font-extrabold text-foreground text-balance">
              Revisa tu correo
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Enviamos un enlace de recuperación a{" "}
              <span className="font-medium text-foreground">{email}</span>. Sigue las
              instrucciones para restablecer tu contraseña.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Volver a iniciar sesión
          </button>
        </div>
      ) : (
        <>
          <header className="animate-rise flex flex-col gap-1">
            <h1 className="font-serif text-3xl font-extrabold text-foreground text-balance">
              Recupera tu acceso
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Escribe tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="animate-rise flex flex-col gap-4"
            style={{ animationDelay: "80ms" }}
          >
            <AuthField
              id="forgot-email"
              label="Correo electrónico"
              type="email"
              icon={Mail}
              value={email}
              onChange={setEmail}
              placeholder="tu@correo.com"
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={!valid}
              className="mt-1 rounded-full bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40"
            >
              Enviar enlace
            </button>
          </form>
        </>
      )}
    </div>
  )
}
