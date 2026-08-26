"use client"

import { useMemo, useState } from "react"
import { Check, Search, X } from "lucide-react"
import { GRINDERS } from "@/lib/mock-data"

export function GrinderSelector({
  selected,
  onSelect,
  onClose,
}: {
  selected: string
  onSelect: (model: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")

  const grouped = useMemo(() => {
    const filtered = GRINDERS.filter((g) =>
      g.model.toLowerCase().includes(query.toLowerCase()),
    )
    const byBrand: Record<string, typeof GRINDERS> = {}
    for (const g of filtered) {
      byBrand[g.brand] ??= []
      byBrand[g.brand].push(g)
    }
    return byBrand
  }, [query])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="glass-strong flex max-h-[80vh] w-full max-w-[400px] flex-col rounded-t-[2rem] sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-muted-foreground/40" aria-hidden="true" />
        </div>

        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-serif text-xl font-bold text-foreground">Selecciona tu molino</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className="flex items-center gap-2.5 rounded-full bg-secondary px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar molino..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {Object.entries(grouped).map(([brand, models]) => (
            <div key={brand} className="pt-3">
              <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {brand}
              </p>
              <div className="flex flex-col gap-1.5">
                {models.map((g) => {
                  const isSelected = selected === g.model
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        onSelect(g.model)
                        onClose()
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm transition-colors ${
                        isSelected
                          ? "border-primary/50 bg-primary/10 text-foreground"
                          : "border-border bg-card text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {g.model}
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
