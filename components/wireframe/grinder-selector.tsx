"use client"

import { Check, Search, X } from "lucide-react"
import { createPortal } from "react-dom"
import { useEffect, useMemo, useRef, useState } from "react"

export type GrinderOption = { id: number; brand: string; name: string }

export function GrinderSelector({ selected, onSelect, onClose }: {
  selected: number
  onSelect: (grinder: GrinderOption) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const [grinders, setGrinders] = useState<GrinderOption[]>([])
  const [error, setError] = useState("")
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setPortalTarget(anchorRef.current?.closest("dialog") ?? document.body)
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/grinders", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("grinders unavailable")
        return response.json()
      })
      .then((payload: { grinders: GrinderOption[] }) => setGrinders(payload.grinders))
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return
        setError("No se pudieron cargar los molinos.")
      })
    return () => controller.abort()
  }, [])

  const grouped = useMemo(() => {
    const filtered = grinders.filter((grinder) => `${grinder.brand} ${grinder.name}`.toLowerCase().includes(query.toLowerCase()))
    return Object.groupBy(filtered, (grinder) => grinder.brand)
  }, [grinders, query])

  if (!portalTarget) return <span ref={anchorRef} aria-hidden="true" />
  return (
    <>
      <span ref={anchorRef} aria-hidden="true" />
      {createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="grinder-title" className="glass-strong flex max-h-[80vh] w-full max-w-[400px] flex-col rounded-[2rem]" onClick={(event) => event.stopPropagation()}>
        <div className="flex justify-center pt-3 sm:hidden"><span className="h-1 w-10 rounded-full bg-muted-foreground/40" aria-hidden="true" /></div>
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 id="grinder-title" className="font-serif text-xl font-bold text-foreground">Selecciona tu molino</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2.5 rounded-full bg-secondary px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="grinder-search" className="sr-only">Buscar molino</label>
            <input id="grinder-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar molino..." className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5" aria-live="polite">
          {error ? <p className="p-6 text-center text-sm text-destructive">{error}</p> : grinders.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">Cargando molinos…</p> : Object.entries(grouped).map(([brand, models]) => (
            <div key={brand} className="pt-3">
              <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{brand}</p>
              <div className="flex flex-col gap-1.5">
                {models?.map((grinder) => {
                  const isSelected = selected === grinder.id
                  return <button key={grinder.id} type="button" onClick={() => { onSelect(grinder); onClose() }} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm transition-colors ${isSelected ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-card text-foreground hover:bg-secondary/50"}`}>{grinder.name}{isSelected && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}</button>
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>, portalTarget)}
    </>
  )
}
