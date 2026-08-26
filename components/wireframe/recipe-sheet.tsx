"use client"

import { useEffect, useRef, useState } from "react"
import { Bookmark, Heart, X } from "lucide-react"
import type { Recipe } from "@/lib/mock-data"
import { ScreenRecipe } from "./screen-recipe"

export function RecipeSheet({
  recipe,
  tempUnit,
  onToggleUnit,
  onOpenGrinder,
  onClose,
  onSavedChange,
}: {
  recipe: Recipe
  tempUnit: "C" | "F"
  onToggleUnit: (unit: "C" | "F") => void
  onOpenGrinder: () => void
  onClose: () => void
  onSavedChange?: (saved: boolean) => void
}) {
  const [visible, setVisible] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [running, setRunning] = useState(false)
  const [saved, setSaved] = useState(recipe.saved)
  const [liked, setLiked] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<number | null>(null)

  // Anima la entrada del sheet al montar.
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function handleClose() {
    setVisible(false)
    window.setTimeout(onClose, 300)
  }

  function handleRunningChange(r: boolean) {
    setRunning(r)
  }

  // El chrome (handle, ×, ⋯) se oculta mientras el timer corre para evitar cierres accidentales.
  const chromeHidden = running

  function onPointerDown(e: React.PointerEvent) {
    if (chromeHidden) return
    dragStart.current = e.clientY
    setDragging(true)
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (dragStart.current === null) return
    const dy = e.clientY - dragStart.current
    if (dy > 0) setDragY(dy)
  }
  function onPointerUp() {
    if (dragStart.current === null) return
    if (dragY > 120) {
      handleClose()
    } else {
      setDragY(0)
    }
    dragStart.current = null
    setDragging(false)
  }

  const translateY = !visible ? "100%" : `${dragY}px`

  return (
    <div className="absolute inset-0 z-40">
      {/* Backdrop oscuro */}
      <button
        type="button"
        aria-label="Cerrar receta"
        onClick={chromeHidden ? undefined : handleClose}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Receta ${recipe.name}`}
        style={{ transform: `translateY(${translateY})`, height: "100%" }}
        className={`absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-3xl border-t border-border bg-background shadow-2xl transition-[transform,height] ${
          dragging ? "duration-0" : "duration-300"
        }`}
      >
        {/* Chrome: handle + acciones */}
        {!chromeHidden && (
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="relative z-10 shrink-0 cursor-grab touch-none active:cursor-grabbing"
          >
            {/* Drag handle */}
            <div className="flex justify-center pb-1 pt-3">
              <span className="h-1.5 w-10 rounded-full bg-muted-foreground/40" aria-hidden="true" />
            </div>
            {/* Fila de acciones: × a la izquierda, ⋯ a la derecha */}
            <div className="flex items-center justify-between gap-2 px-4 pb-2">
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar"
                className="glass flex h-10 w-10 items-center justify-center rounded-full text-foreground"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActionsOpen((v) => !v)}
                  aria-label="Más opciones"
                  aria-expanded={actionsOpen}
                  className="glass flex h-10 w-10 items-center justify-center rounded-full text-foreground"
                >
                  <span className="text-lg leading-none" aria-hidden="true">
                    {"\u2026"}
                  </span>
                </button>
                {actionsOpen && (
                  <>
                    {/* Cierra el menú al hacer clic fuera */}
                    <button
                      type="button"
                      aria-hidden="true"
                      tabIndex={-1}
                      onClick={() => setActionsOpen(false)}
                      className="fixed inset-0 z-10 cursor-default"
                    />
                    <div className="absolute right-0 top-12 z-20 flex min-w-48 flex-col gap-1 rounded-2xl border border-border bg-card p-2 shadow-2xl">
                      <button
                        type="button"
                        onClick={() => {
                          setSaved((v) => {
                            const next = !v
                            onSavedChange?.(next)
                            return next
                          })
                          setActionsOpen(false)
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground hover:bg-secondary/60"
                      >
                        <Bookmark className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
                        {saved ? "Quitar de guardados" : "Guardar receta"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLiked((v) => !v)
                          setActionsOpen(false)
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground hover:bg-secondary/60"
                      >
                        <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} />
                        {liked ? "Quitar me gusta" : "Dar me gusta"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contenido con scroll interno */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ScreenRecipe
            recipe={recipe}
            tempUnit={tempUnit}
            onToggleUnit={onToggleUnit}
            onOpenGrinder={onOpenGrinder}
            saved={saved}
            onToggleSaved={() => setSaved((v) => {
              const next = !v
              onSavedChange?.(next)
              return next
            })}
            onRunningChange={handleRunningChange}
          />
        </div>
      </div>
    </div>
  )
}
