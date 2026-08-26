"use client"

import { X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { RecipeView, UserPreferences } from "@/lib/domain"
import { RecipeExperience } from "./recipe-experience"

export function RecipeSheet({ recipe, preferences, onClose }: { recipe: RecipeView; preferences: UserPreferences; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog ref={dialogRef} onCancel={(event) => { if (running) event.preventDefault(); else onClose() }} className="m-auto h-[100dvh] w-full max-w-[400px] overflow-hidden border-0 bg-background p-0 text-foreground backdrop:bg-black/70 sm:h-[calc(100dvh-2rem)] sm:rounded-[2.5rem]">
      <div className="flex h-full flex-col">
        {!running && (
          <div className="absolute inset-x-0 top-0 z-20 flex justify-end p-4">
            <button type="button" onClick={onClose} aria-label="Cerrar receta" className="glass flex h-10 w-10 items-center justify-center rounded-full"><X className="h-5 w-5" aria-hidden="true" /></button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <RecipeExperience recipe={recipe} initialPreferences={preferences} onRunningChange={setRunning} />
        </div>
      </div>
    </dialog>
  )
}
