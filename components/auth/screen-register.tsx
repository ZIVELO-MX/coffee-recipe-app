"use client"

import { useState } from "react"
import { ArrowLeft, Lock, Mail, User } from "lucide-react"
import { AuthField } from "./auth-field"
import { SocialButtons } from "./social-buttons"

export function ScreenRegister({
  onNext,
  onGoLogin,
}: {
  onNext: (data: { name: string; email: string }) => void
  onGoLogin: () => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const valid = name.trim().length >= 2 && email.includes("@") && password.length >= 4

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (valid) onNext({ name: name.trim(), email })
  }

  return (
    <div className="flex min-h-full flex-col gap-7 px-6 pb-12 pt-14">
      <button
        type="button"
        onClick={onGoLogin}
        aria-label="Volver a iniciar sesión"
        className="glass flex h-10 w-10 items-center justify-center rounded-full text-foreground"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>

      <header className="animate-rise flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-extrabold text-foreground text-balance">
          Crea tu cuenta
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Únete y empieza a guardar tus recetas favoritas
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="animate-rise flex flex-col gap-4"
        style={{ animationDelay: "80ms" }}
      >
        <AuthField
          id="register-name"
          label="Nombre"
          icon={User}
          value={name}
          onChange={setName}
          placeholder="Tu nombre"
          autoComplete="name"
        />
        <AuthField
          id="register-email"
          label="Correo electrónico"
          type="email"
          icon={Mail}
          value={email}
          onChange={setEmail}
          placeholder="tu@correo.com"
          autoComplete="email"
        />
        <AuthField
          id="register-password"
          label="Contraseña"
          type="password"
          icon={Lock}
          value={password}
          onChange={setPassword}
          placeholder="Mínimo 4 caracteres"
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={!valid}
          className="mt-1 rounded-full bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40"
        >
          Continuar
        </button>
      </form>

      <div className="animate-rise" style={{ animationDelay: "160ms" }}>
        <SocialButtons action="Registrarse" />
      </div>

      <p className="mt-auto text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <button
          type="button"
          onClick={onGoLogin}
          className="font-semibold text-primary transition-opacity hover:opacity-80"
        >
          Inicia sesión
        </button>
      </p>
    </div>
  )
}
