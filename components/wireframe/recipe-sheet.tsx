"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { RecipeView, UserPreferences } from "@/lib/domain"
import { RecipeExperience, type TimerStatus } from "./recipe-experience"

export function RecipeSheet({ recipe, preferences, onClose }: { recipe: RecipeView; preferences: UserPreferences; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ y: number; time: number } | null>(null)
  const closeTimer = useRef<number | null>(null)
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle")
  const [dragOffset, setDragOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
      dialog?.close()
    }
  }, [])

  const requestDismiss = useCallback(() => {
    setClosing(true)
    dialogRef.current?.close()
    closeTimer.current = window.setTimeout(onClose, 120)
  }, [onClose])

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element) || (!event.target.closest("[data-drag-handle]") && !event.target.closest("header")) || event.target.closest("button, [data-no-drag]")) return
    dragStart.current = { y: event.clientY, time: performance.now() }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return
    setDragOffset(Math.max(0, event.clientY - dragStart.current.y))
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const start = dragStart.current
    if (!start) return
    dragStart.current = null
    setDragging(false)
    const distance = Math.max(0, event.clientY - start.y)
    const velocity = distance / Math.max(1, performance.now() - start.time)
    setDragOffset(0)
    if (distance > 120 || velocity > 0.7) requestDismiss()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Receta ${recipe.name}`}
      onCancel={(event) => { event.preventDefault(); requestDismiss() }}
      onClick={(event) => { if (event.target === event.currentTarget) requestDismiss() }}
      className={`recipe-dialog m-0 mt-auto h-[96dvh] w-full max-w-[400px] overflow-hidden border-0 bg-background p-0 text-foreground backdrop:bg-black/65 sm:mb-4 sm:h-[calc(100dvh-2rem)] sm:rounded-[2.5rem] ${closing ? "recipe-dialog-closing" : ""}`}
    >
      <div
        ref={scrollContainerRef}
        data-recipe-scroll
        className="relative flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain [touch-action:pan-y]"
        style={{ transform: `translateY(${dragOffset}px)`, transition: dragging ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <RecipeExperience
          recipe={recipe}
          initialPreferences={preferences}
          timerStatus={timerStatus}
          scrollContainerRef={scrollContainerRef}
          onTimerStatusChange={(status) => {
            setTimerStatus(status)
          }}
          onRequestClose={requestDismiss}
        />
      </div>
    </dialog>
  )
}
