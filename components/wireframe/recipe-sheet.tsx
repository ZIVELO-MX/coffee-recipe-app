"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { RecipeView, UserPreferences } from "@/lib/domain"
import { RecipeExperience, type TimerStatus } from "./recipe-experience"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function RecipeSheet({ recipe, preferences, onClose }: { recipe: RecipeView; preferences: UserPreferences; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ y: number; time: number } | null>(null)
  const closeTimer = useRef<number | null>(null)
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle")
  const [dragOffset, setDragOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [closing, setClosing] = useState(false)
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog?.showModal()
    requestAnimationFrame(() => {
      const heading = dialog?.querySelector("h1")
      if (heading instanceof HTMLElement) {
        heading.tabIndex = -1
        heading.focus({ preventScroll: true })
      }
    })
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
      dialog?.close()
      if (openerRef.current?.isConnected) openerRef.current.focus({ preventScroll: true })
    }
  }, [])

  const forceDismiss = useCallback(() => {
    if (closing || closeTimer.current) return
    setConfirmCloseOpen(false)
    setClosing(true)
    closeTimer.current = window.setTimeout(() => {
      dialogRef.current?.close()
      onClose()
    }, 220)
  }, [closing, onClose])

  const requestDismiss = useCallback(() => {
    if (closing || closeTimer.current) return
    if (timerStatus === "running" || timerStatus === "paused") {
      setConfirmCloseOpen(true)
      return
    }
    forceDismiss()
  }, [closing, forceDismiss, timerStatus])

  function startDrag(event: React.PointerEvent<HTMLDialogElement>) {
    if (confirmCloseOpen) return
    if (!(event.target instanceof Element) || (!event.target.closest("[data-drag-handle]") && !event.target.closest("header")) || event.target.closest("button, [data-no-drag]")) return
    dragStart.current = { y: event.clientY, time: performance.now() }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveDrag(event: React.PointerEvent<HTMLDialogElement>) {
    if (!dragStart.current) return
    setDragOffset(Math.max(0, event.clientY - dragStart.current.y))
  }

  function endDrag(event: React.PointerEvent<HTMLDialogElement>) {
    const start = dragStart.current
    if (!start) return
    dragStart.current = null
    setDragging(false)
    const distance = Math.max(0, event.clientY - start.y)
    const velocity = distance / Math.max(1, performance.now() - start.time)
    setDragOffset(0)
    if (distance > 120 || velocity > 0.7) requestDismiss()
  }

  function cancelDrag() {
    dragStart.current = null
    setDragging(false)
    setDragOffset(0)
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Receta ${recipe.name}`}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={cancelDrag}
      onCancel={(event) => { event.preventDefault(); requestDismiss() }}
      onClick={(event) => { if (event.target === event.currentTarget) requestDismiss() }}
      className={`recipe-dialog m-0 mt-auto h-[100dvh] w-screen max-w-none overflow-hidden border-0 bg-background p-0 text-foreground backdrop:bg-black/65 sm:mb-4 sm:h-[calc(100dvh-2rem)] sm:w-full sm:max-w-[400px] sm:rounded-[2.5rem] ${closing ? "recipe-dialog-closing" : ""}`}
    >
      <span data-drag-handle aria-hidden="true" className="pointer-events-auto absolute inset-x-14 top-0 z-40 flex h-8 items-start justify-center pt-2 [touch-action:none]">
        <span className="h-1.5 w-12 rounded-full bg-muted-foreground/40" />
      </span>
      <div
        ref={scrollContainerRef}
        data-recipe-scroll
        className="scrollbar-mobile-hidden relative flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain [touch-action:pan-y]"
        style={{ transform: dragOffset ? `translateY(${dragOffset}px)` : undefined, transition: dragging ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)" }}
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
      <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir de la receta?</AlertDialogTitle>
            <AlertDialogDescription>El cronómetro está activo. Si sales perderás el progreso de esta preparación.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar receta</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={forceDismiss}>Salir y perder progreso</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </dialog>
  )
}
