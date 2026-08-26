"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowLeft, Check } from "lucide-react"
import { AVATARS, DEFAULT_AVATAR } from "@/lib/avatars"

export function ScreenAvatar({
  name,
  onBack,
  onFinish,
}: {
  name: string
  onBack: () => void
  onFinish: (avatarId: string) => void
}) {
  const [selected, setSelected] = useState(DEFAULT_AVATAR.id)

  return (
    <div className="flex min-h-full flex-col gap-7 px-6 pb-12 pt-14">
      <button
        type="button"
        onClick={onBack}
        aria-label="Volver"
        className="glass flex h-10 w-10 items-center justify-center rounded-full text-foreground"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>

      <header className="animate-rise flex flex-col gap-1">
        <p className="text-sm font-medium text-primary">Hola, {name}</p>
        <h1 className="font-serif text-3xl font-extrabold text-foreground text-balance">
          Elige tu avatar
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Selecciona una foto de perfil de nuestro catálogo.
        </p>
      </header>

      <div
        className="animate-rise grid grid-cols-3 gap-4"
        style={{ animationDelay: "80ms" }}
      >
        {AVATARS.map((a) => {
          const isSelected = selected === a.id
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelected(a.id)}
              aria-label={a.label}
              aria-pressed={isSelected}
              className={`relative aspect-square overflow-hidden rounded-3xl border-2 transition-all duration-200 active:scale-95 ${
                isSelected
                  ? "border-primary scale-105 shadow-2xl"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={a.src || "/placeholder.svg"}
                alt={a.label}
                fill
                sizes="(max-width: 400px) 30vw, 120px"
                className="h-full w-full object-cover"
              />
              {isSelected && (
                <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => onFinish(selected)}
        className="mt-auto rounded-full bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
      >
        Completar registro
      </button>
    </div>
  )
}
