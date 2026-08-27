"use client"

import { Bookmark, Check, ChevronRight, Ellipsis, Heart, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { METHOD_LABEL, type RecipeView } from "@/lib/domain"
import { formatTemp, mmss, ratio, totalSeconds } from "@/lib/format"
import { Timeline } from "./timeline"
import type { RecipeMode, TimerStatus } from "./recipe-experience"

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
      {children}
    </h2>
  )
}

function SpecRow({
  label,
  value,
  onClick,
  ariaLabel,
}: {
  label: string
  value: React.ReactNode
  onClick?: () => void
  ariaLabel?: string
}) {
  const content = (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className="-mx-4 flex w-[calc(100%+2rem)] items-center justify-between border-b border-border px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-secondary/50"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="flex items-center justify-between border-b border-border py-3 text-sm last:border-b-0">
      {content}
    </div>
  )
}

export function ScreenRecipe({
  recipe,
  mode,
  timerStatus,
  tempUnit,
  onToggleUnit,
  onOpenGrinder,
  saved,
  onToggleSaved,
  liked,
  likeCount,
  onToggleLiked,
  grinderName,
  grindSetting,
  onTimerStatusChange,
  onRequestClose,
}: {
  recipe: RecipeView
  mode: RecipeMode
  timerStatus: TimerStatus
  tempUnit: "C" | "F"
  onToggleUnit: (unit: "C" | "F") => void
  onOpenGrinder: () => void
  saved: boolean
  onToggleSaved: () => void
  liked: boolean
  likeCount: number
  onToggleLiked: () => void
  grinderName: string
  grindSetting: string
  onTimerStatusChange: (status: TimerStatus) => void
  onRequestClose: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const preparationMode = mode === "prepare"

  useEffect(() => {
    if (!menuOpen) return
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [menuOpen])

  return (
    <div className={`flex min-h-full flex-col pb-40 ${preparationMode ? "recipe-preparation" : ""}`}>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between bg-background/90 px-4 backdrop-blur-xl" aria-label="Acciones de receta">
        <button data-no-drag type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onRequestClose} aria-label="Cerrar receta" className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div ref={menuRef} className="relative ml-auto">
          <button data-no-drag ref={menuButtonRef} type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setMenuOpen((open) => !open)} aria-label="Más acciones" aria-haspopup="menu" aria-expanded={menuOpen} className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary">
            <Ellipsis className="h-5 w-5" aria-hidden="true" />
          </button>
          {menuOpen && (
            <div role="menu" aria-label="Acciones de receta" className="glass-strong absolute right-0 top-12 z-50 flex min-w-52 flex-col gap-1 rounded-2xl p-2 shadow-2xl">
              <button data-no-drag role="menuitemcheckbox" aria-checked={liked} type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onToggleLiked} className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 text-left text-sm hover:bg-secondary">
                <span className="inline-flex items-center gap-2"><Heart className={`h-4 w-4 text-primary ${liked ? "fill-primary" : ""}`} aria-hidden="true" />{liked ? "Quitar like" : "Dar like"}</span>
                {liked && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
              </button>
              <button data-no-drag role="menuitemcheckbox" aria-checked={saved} type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onToggleSaved} className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 text-left text-sm hover:bg-secondary">
                <span className="inline-flex items-center gap-2"><Bookmark className={`h-4 w-4 text-primary ${saved ? "fill-primary" : ""}`} aria-hidden="true" />{saved ? "Quitar guardado" : "Guardar"}</span>
                {saved && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
              </button>
            </div>
          )}
        </div>
      </header>
      <div data-drag-handle className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-11 items-center justify-center" aria-hidden="true">
        <span className="pointer-events-auto h-1.5 w-12 rounded-full bg-muted-foreground/40 [touch-action:none]" />
      </div>
      {/* Hero con imagen y overlay */}
      <div className="relative h-64 w-full shrink-0 overflow-hidden">
        <Image
          src={recipe.image || "/icon.svg"}
          alt={`Café preparado con método ${METHOD_LABEL[recipe.method]}`}
          fill
          sizes="(max-width: 400px) 100vw, 400px"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/10" />

        {/* Título sobre la imagen */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4">
          <span className="glass w-fit rounded-full px-3 py-1 text-xs font-medium text-foreground">
            {METHOD_LABEL[recipe.method]}
          </span>
          <h1 className="font-serif text-3xl font-extrabold leading-tight text-foreground text-balance">
            {recipe.name}
          </h1>
          <p className="text-sm text-muted-foreground">por {recipe.author}</p>
        </div>
      </div>

      <div className="flex flex-col gap-7 p-4 pt-6">
        {/* Resumen rápido (Duolingo-style, targets grandes) */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Proporción", value: ratio(recipe) },
            { label: "Café", value: `${recipe.coffee_g} g` },
            { label: "Tiempo", value: mmss(totalSeconds(recipe)) },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-4"
            >
              <span className="font-mono text-lg font-semibold text-foreground">{s.value}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Características */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Características</SectionTitle>
          <div className="rounded-3xl border border-border bg-card px-4 py-4">
            <SpecRow label="Café" value={`${recipe.coffee_g} g`} />
            <SpecRow label="Agua" value={`${recipe.water_ml} ml`} />
            <SpecRow label="Proporción" value={ratio(recipe)} />
            <SpecRow
              label="Temperatura"
              onClick={() => onToggleUnit(tempUnit === "C" ? "F" : "C")}
              ariaLabel={`Temperatura en grados ${tempUnit === "C" ? "Celsius" : "Fahrenheit"}, pulsa para cambiar`}
              value={
                <span className="inline-flex items-center gap-2">
                  {formatTemp(recipe.temperature_c, tempUnit)}
                  <span className="flex rounded-full bg-secondary p-0.5" aria-hidden="true">
                    {(["C", "F"] as const).map((u) => (
                      <span
                        key={u}
                        className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                          tempUnit === u
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        °{u}
                      </span>
                    ))}
                  </span>
                </span>
              }
            />
            <SpecRow
              label="Molienda"
              onClick={onOpenGrinder}
              ariaLabel="Cambiar molienda"
              value={
                <span className="inline-flex items-center gap-1 text-primary">
                  {grindSetting} · {grinderName}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              }
            />
          </div>
        </section>

        {/* Preparación */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Preparación</SectionTitle>
          <ol className="flex flex-col gap-2.5">
            {recipe.preparation.map((p, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-2xl border border-border bg-card p-4 text-sm text-foreground"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="text-pretty leading-relaxed">{p}</span>
              </li>
            ))}
          </ol>
        </section>

      </div>

      <section className={`flex flex-col gap-3 ${preparationMode ? "min-h-0 flex-1 px-4 pt-5" : "p-4 pt-0"}`} aria-label={preparationMode ? "Preparar receta" : "Tiempo"}>
        {preparationMode ? <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Tiempo</p><h1 className="mt-1 font-serif text-2xl font-extrabold leading-tight text-foreground">{recipe.name}</h1></div> : <SectionTitle>Tiempo</SectionTitle>}
        <Timeline recipe={recipe} focused={preparationMode} onTimerStatusChange={onTimerStatusChange} />
      </section>

      <section className="flex flex-col gap-3 p-4 pt-0">
        <SectionTitle>Comunidad</SectionTitle>
        <div className="flex items-center justify-between rounded-3xl border border-border bg-card p-4">
          <span className="inline-flex items-center gap-2 text-sm text-foreground"><Heart className={`h-5 w-5 text-primary ${liked ? "fill-primary" : ""}`} aria-hidden="true" /> A {likeCount} personas les gusta</span>
          <span className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground">{saved ? "Guardada" : "No guardada"}</span>
        </div>
      </section>
    </div>
  )
}
