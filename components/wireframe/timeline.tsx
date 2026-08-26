"use client"

import { useEffect, useRef, useState } from "react"
import { Pause, Play, RotateCcw } from "lucide-react"
import type { RecipeView } from "@/lib/domain"
import { mmss } from "@/lib/format"

export function Timeline({
  recipe,
  onRunningChange,
}: {
  recipe: RecipeView
  onRunningChange?: (running: boolean) => void
}) {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const startedAt = useRef<number | null>(null)
  const pausedAt = useRef(0)
  const notifiedStep = useRef(-1)
  const activeStepRef = useRef<HTMLLIElement>(null)

  const total = recipe.steps.at(-1)?.end ?? recipe.steps.at(-1)?.start ?? 0
  const activeIndex = recipe.steps.findLastIndex((step) => elapsed >= step.start)
  const safeActiveIndex = Math.max(0, Math.min(activeIndex, recipe.steps.length - 1))
  const active = recipe.steps[safeActiveIndex]

  useEffect(() => {
    onRunningChange?.(running)
    if (running) {
      activeStepRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [onRunningChange, running])

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

  useEffect(() => {
    if (safeActiveIndex !== notifiedStep.current && running) {
      notifiedStep.current = safeActiveIndex
      navigator.vibrate?.(100)
      activeStepRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [safeActiveIndex, running])

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
    notifiedStep.current = -1
  }

  if (!active) return null

  return (
    <div className="flex flex-col gap-5">
      {/* Cronómetro — elemento signature "liquid glass" con glow cálido */}
      <div
        className={`glass-strong fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[368px] -translate-x-1/2 flex-col gap-4 rounded-3xl p-5 transition-shadow ${
          running ? "animate-pulse-glow" : "glow-accent"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-mono text-5xl font-semibold tabular-nums text-foreground">
              {mmss(Math.floor(elapsed))}
            </span>
            <span className="text-sm text-muted-foreground">{active.instruction}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                reset()
              }}
              aria-label="Reiniciar"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground transition-transform active:scale-90"
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={toggleRunning}
              aria-label={running ? "Pausar" : completed ? "Completada" : "Iniciar"}
              disabled={completed}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90"
            >
              {running ? (
                <Pause className="h-6 w-6 fill-current" aria-hidden="true" />
              ) : (
                <Play className="h-6 w-6 fill-current" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lista vertical de pasos */}
      <ol className="flex flex-col pb-2">
        {recipe.steps.map((step, i) => {
          const isActive = i === safeActiveIndex && !completed
          const isDone = completed || i < safeActiveIndex
          return (
            <li ref={isActive ? activeStepRef : undefined} key={i} className="flex gap-3">
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
