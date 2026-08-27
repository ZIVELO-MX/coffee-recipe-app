"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import { createPortal } from "react-dom"
import { Pause, Play, RotateCcw } from "lucide-react"
import type { RecipeView } from "@/lib/domain"
import { mmss } from "@/lib/format"

export function Timeline({
  recipe,
  scrollContainerRef,
  onTimerStatusChange,
}: {
  recipe: RecipeView
  scrollContainerRef: RefObject<HTMLDivElement | null>
  onTimerStatusChange: (status: "idle" | "running" | "paused" | "completed") => void
}) {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const startedAt = useRef<number | null>(null)
  const pausedAt = useRef(0)
  const activeStepRef = useRef<HTMLLIElement>(null)
  const initialFocusDone = useRef(false)

  const total = recipe.steps.at(-1)?.end ?? recipe.steps.at(-1)?.start ?? 0
  const activeIndex = recipe.steps.findLastIndex((step) => elapsed >= step.start)
  const safeActiveIndex = Math.max(0, Math.min(activeIndex, recipe.steps.length - 1))
  const active = recipe.steps[safeActiveIndex]

  useEffect(() => {
    const setup = window.setTimeout(() => {
      const scroller = scrollContainerRef.current
      const dialog = scroller?.closest("dialog")
      if (!dialog) return
      setPortalTarget(dialog)
    }, 0)
    return () => {
      window.clearTimeout(setup)
    }
  }, [scrollContainerRef])

  useEffect(() => {
    onTimerStatusChange(completed ? "completed" : running ? "running" : elapsed > 0 ? "paused" : "idle")
    if (running && !initialFocusDone.current) {
      initialFocusDone.current = true
      activeStepRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [completed, elapsed, onTimerStatusChange, running])

  useEffect(() => {
    if (!running) return
    startedAt.current = performance.now()
    const interval = window.setInterval(() => {
      const nextElapsed = pausedAt.current + (performance.now() - (startedAt.current ?? performance.now())) / 1000
      setElapsed(Math.min(nextElapsed, total))
      if (nextElapsed >= total) {
        setRunning(false)
        setCompleted(true)
        navigator.vibrate?.(500)
      }
    }, 250)
    return () => window.clearInterval(interval)
  }, [running, total])

  function toggleRunning() {
    if (completed) return
    if (running) {
      pausedAt.current = elapsed
      setRunning(false)
    } else {
      setRunning(true)
    }
  }

  function reset() {
    setRunning(false)
    setCompleted(false)
    setElapsed(0)
    pausedAt.current = 0
    startedAt.current = null
    initialFocusDone.current = false
  }

  if (!active) return null

  const timer = (
    <div
      className={`glass-strong absolute bottom-6 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-[368px] -translate-x-1/2 flex-col gap-2 rounded-2xl p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-[box-shadow,transform] ${
        running ? "animate-pulse-glow" : "glow-accent"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-2xl font-mono font-semibold tabular-nums text-foreground">
            {mmss(Math.floor(elapsed))}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={reset} aria-label="Reiniciar" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-transform active:scale-90"><RotateCcw className="h-5 w-5" aria-hidden="true" /></button>
          <button type="button" onClick={toggleRunning} aria-label={running ? "Pausar" : completed ? "Completada" : "Iniciar"} disabled={completed} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90">
            {running ? <Pause className="h-6 w-6 fill-current" aria-hidden="true" /> : <Play className="h-6 w-6 fill-current" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Cronómetro — elemento signature "liquid glass" con glow cálido */}
      {portalTarget && createPortal(timer, portalTarget)}

      {/* Lista vertical de pasos */}
      <ol className="flex flex-col pb-2">
        {recipe.steps.map((step, i) => {
          const isActive = i === safeActiveIndex && !completed
          const isDone = completed || i < safeActiveIndex
          return (
            <li ref={isActive ? activeStepRef : undefined} key={i} className="flex gap-3 transition-opacity">
              {/* Riel */}
              <div className="flex flex-col items-center">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center ${i === 0 ? "rounded-[14px]" : "rounded-full"} text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-primary/25 text-primary"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                {i < recipe.steps.length - 1 && (
                  <span
                    className={`w-0.5 flex-1 ${isDone ? "bg-primary/40" : "bg-border"}`}
                    aria-hidden="true"
                  />
                )}
              </div>
              {/* Contenido */}
              <button
                type="button"
                className={`mb-2.5 flex-1 rounded-2xl border p-4 text-left transition-colors ${
                  isActive
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-card"
                }`}
              >
                <p className="font-mono text-xs text-primary">
                  {mmss(step.start)} – {mmss(step.end ?? recipe.steps[i + 1]?.start ?? total)}
                </p>
                <p
                  className={`text-sm leading-relaxed ${
                    isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.instruction}
                </p>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
