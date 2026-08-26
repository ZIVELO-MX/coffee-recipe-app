"use client"

import { X } from "lucide-react"

export type FilterGroup = {
  label: string
  key: "method" | "coffee" | "water" | "temperature" | "duration"
  options: { label: string; value: string }[]
}

export const FILTER_GROUPS: FilterGroup[] = [
  { label: "Método", key: "method", options: [
    { label: "V60", value: "v60" }, { label: "Chemex", value: "chemex" },
    { label: "AeroPress", value: "aeropress" }, { label: "Prensa francesa", value: "french-press" },
    { label: "Kalita", value: "kalita" }, { label: "Moka", value: "moka" },
  ] },
  { label: "Café", key: "coffee", options: [
    { label: "10–15 g", value: "10-15" }, { label: "15–20 g", value: "15-20" },
    { label: "20–25 g", value: "20-25" }, { label: "25 g+", value: "25-plus" },
  ] },
  { label: "Agua", key: "water", options: [
    { label: "150–250 ml", value: "150-250" }, { label: "250–350 ml", value: "250-350" },
    { label: "350–500 ml", value: "350-500" }, { label: "500 ml+", value: "500-plus" },
  ] },
  { label: "Temperatura", key: "temperature", options: [
    { label: "85–89 °C", value: "85-89" }, { label: "90–93 °C", value: "90-93" },
    { label: "94–96 °C", value: "94-96" },
  ] },
  { label: "Tiempo", key: "duration", options: [
    { label: "< 2:30", value: "150-less" }, { label: "2:30–3:30", value: "150-210" },
    { label: "3:30–4:30", value: "210-270" }, { label: "> 4:30", value: "270-plus" },
  ] },
]

export function FilterSheet({
  active,
  onToggle,
  onClear,
  onClose,
}: {
  active: Record<string, string[]>
  onToggle: (key: FilterGroup["key"], value: string) => void
  onClear: () => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="glass-strong flex max-h-[85vh] w-full max-w-[400px] flex-col rounded-t-[2rem] sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-muted-foreground/40" aria-hidden="true" />
        </div>

        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-serif text-xl font-bold text-foreground">Filtros</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {FILTER_GROUPS.map((group) => (
            <div key={group.label} className="border-b border-border py-4 last:border-b-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const isActive = active[group.key]?.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onToggle(group.key, opt.value)}
                      aria-pressed={isActive}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground hover:bg-accent"
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 p-5">
          <button
            type="button"
            onClick={onClear}
            className="rounded-full px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </div>
  )
}
