"use client"

import { SlidersHorizontal, X } from "lucide-react"

export function FilterBar({
  filters,
  onRemove,
  onMore,
  onClear,
}: {
  filters: { id: string; label: string }[]
  onRemove: (id: string) => void
  onMore: () => void
  onClear?: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onMore}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        Filtros{filters.length > 0 ? ` · ${filters.length}` : ""}
      </button>

      {filters.map((f) => (
        <span
          key={f.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-medium text-foreground"
        >
          {f.label}
          <button
            type="button"
            onClick={() => onRemove(f.id)}
            aria-label={`Quitar filtro ${f.label}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </span>
      ))}
      {filters.length > 0 && onClear && (
        <button type="button" onClick={onClear} className="px-2 py-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Limpiar
        </button>
      )}
    </div>
  )
}
