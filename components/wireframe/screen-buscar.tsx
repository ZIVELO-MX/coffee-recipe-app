"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { METHOD_LABEL, RECIPES } from "@/lib/mock-data"
import { RecipeCard } from "./recipe-card"
import { FilterBar } from "./filter-bar"
import { FilterSheet } from "./filter-sheet"
import { totalSeconds } from "@/lib/format"

export function ScreenBuscar({
  onOpen,
  savedIds = [],
}: {
  onOpen: (id: string) => void
  savedIds?: string[]
}) {
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<string[]>(["V60", "250–350 ml"])
  const [sheetOpen, setSheetOpen] = useState(false)

  function toggleFilter(value: string) {
    setFilters((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]))
  }

  const results = useMemo(() => {
    const q = query.toLowerCase()
    return RECIPES.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        METHOD_LABEL[r.method].toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q),
    ).filter((r) =>
      filters.every((filter) => {
        if (filter === "V60") return r.method === "v60"
        if (filter === "Chemex") return r.method === "chemex"
        if (filter === "Aeropress") return r.method === "aeropress"
        if (filter === "Prensa francesa") return r.method === "french-press"
        if (filter === "Kalita") return false
        if (filter === "10–15 g") return r.coffee_g >= 10 && r.coffee_g <= 15
        if (filter === "15–20 g") return r.coffee_g > 15 && r.coffee_g <= 20
        if (filter === "20–25 g") return r.coffee_g > 20 && r.coffee_g <= 25
        if (filter === "25 g+") return r.coffee_g > 25
        if (filter === "150–250 ml") return r.water_ml >= 150 && r.water_ml <= 250
        if (filter === "250–350 ml") return r.water_ml > 250 && r.water_ml <= 350
        if (filter === "350–500 ml") return r.water_ml > 350 && r.water_ml <= 500
        if (filter === "500 ml+") return r.water_ml > 500
        if (filter === "85–89 °C") return r.temperature_c >= 85 && r.temperature_c <= 89
        if (filter === "90–93 °C") return r.temperature_c >= 90 && r.temperature_c <= 93
        if (filter === "94–96 °C") return r.temperature_c >= 94 && r.temperature_c <= 96
        const seconds = totalSeconds(r)
        if (filter === "< 2:30") return seconds < 150
        if (filter === "2:30–3:30") return seconds >= 150 && seconds <= 210
        if (filter === "3:30–4:30") return seconds > 210 && seconds <= 270
        if (filter === "> 4:30") return seconds > 270
        return true
      }),
    )
  }, [filters, query])

  return (
    <div className="flex flex-col gap-5 px-4 pb-32 pt-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-primary">Buenos días</p>
        <h1 className="font-serif text-3xl font-extrabold leading-tight text-foreground text-balance">
          ¿Qué preparamos hoy?
        </h1>
      </header>

      {/* Búsqueda */}
      <div className="glass flex items-center gap-2.5 rounded-full px-4 py-3">
        <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar recetas, métodos o baristas..."
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <FilterBar
        filters={filters}
        onRemove={(f) => setFilters((prev) => prev.filter((x) => x !== f))}
        onMore={() => setSheetOpen(true)}
      />

      {/* Resultados */}
      <div className="flex flex-col gap-4">
        {results.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Sin resultados
          </p>
        ) : (
          results.map((r, i) => (
            <RecipeCard key={r._id} recipe={r} onOpen={onOpen} index={i} saved={savedIds.includes(r._id)} />
          ))
        )}
      </div>

      {sheetOpen && (
        <FilterSheet
          active={filters}
          onToggle={toggleFilter}
          onClear={() => setFilters([])}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  )
}
