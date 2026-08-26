"use client"

import { Search } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { type FormEvent, useState, useTransition } from "react"
import type { RecipeFilters, RecipePage } from "@/lib/domain"
import { RecipeCard } from "./recipe-card"
import { FilterBar } from "./filter-bar"
import { FILTER_GROUPS, FilterSheet, type FilterGroup } from "./filter-sheet"

const FILTER_KEYS: FilterGroup["key"][] = ["method", "coffee", "water", "temperature", "duration"]

export function ScreenBuscar({ result, filters }: { result: RecipePage; filters: RecipeFilters }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const active = Object.fromEntries(FILTER_KEYS.map((key) => [key, filters[key]])) as Record<FilterGroup["key"], string[]>
  const labels = new Map(FILTER_GROUPS.flatMap((group) => group.options.map((option) => [`${group.key}:${option.value}`, option.label])))
  const chips = FILTER_KEYS.flatMap((key) => active[key].map((value) => `${key}:${value}`))

  function navigate(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams()
    if (filters.q) params.set("q", filters.q)
    for (const key of FILTER_KEYS) for (const value of filters[key]) params.append(key, value)
    if (filters.pageSize !== 20) params.set("pageSize", String(filters.pageSize))
    mutator(params)
    params.delete("page")
    startTransition(() => router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false }))
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate((params) => {
      const value = String(new FormData(event.currentTarget).get("q") ?? "").trim()
      if (value) params.set("q", value)
      else params.delete("q")
    })
  }

  function toggleFilter(key: FilterGroup["key"], value: string) {
    navigate((params) => {
      const current = params.getAll(key)
      params.delete(key)
      for (const item of current.includes(value) ? current.filter((item) => item !== value) : [...current, value]) params.append(key, item)
    })
  }

  function clearFilters() {
    navigate((params) => FILTER_KEYS.forEach((key) => params.delete(key)))
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(window.location.search)
    if (page > 1) params.set("page", String(page))
    else params.delete("page")
    startTransition(() => router.replace(`${pathname}${params.size ? `?${params}` : ""}`))
  }

  return (
    <div className={`flex flex-col gap-5 px-4 pb-32 pt-8 transition-opacity ${pending ? "opacity-60" : "opacity-100"}`} aria-busy={pending}>
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-primary">Buenos días</p>
        <h1 className="font-serif text-3xl font-extrabold leading-tight text-foreground text-balance">¿Qué preparamos hoy?</h1>
      </header>

      <search>
        <form onSubmit={submitSearch} className="glass flex items-center gap-2.5 rounded-full px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="recipe-search" className="sr-only">Buscar recetas</label>
          <input key={filters.q} id="recipe-search" type="search" name="q" defaultValue={filters.q} placeholder="Buscar recetas, métodos o baristas..." className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
          <button type="submit" className="sr-only">Buscar</button>
        </form>
      </search>

      <FilterBar
        filters={chips.map((chip) => labels.get(chip) ?? chip)}
        onRemove={(label) => {
          const chip = chips.find((candidate) => labels.get(candidate) === label)
          if (!chip) return
          const [key, value] = chip.split(":") as [FilterGroup["key"], string]
          toggleFilter(key, value)
        }}
        onMore={() => setSheetOpen(true)}
      />

      <div className="flex flex-col gap-4" aria-live="polite">
        {result.data.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Sin resultados</p>
        ) : result.data.map((recipe, index) => <RecipeCard key={recipe._id} recipe={recipe} index={index} />)}
      </div>

      {result.total > result.pageSize && (
        <nav aria-label="Paginación de recetas" className="flex items-center justify-between gap-3">
          <button type="button" disabled={result.page <= 1 || pending} onClick={() => goToPage(result.page - 1)} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40">Anterior</button>
          <span className="text-xs text-muted-foreground">Página {result.page} de {Math.ceil(result.total / result.pageSize)}</span>
          <button type="button" disabled={result.page * result.pageSize >= result.total || pending} onClick={() => goToPage(result.page + 1)} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40">Siguiente</button>
        </nav>
      )}

      {sheetOpen && <FilterSheet active={active} onToggle={toggleFilter} onClear={clearFilters} onClose={() => setSheetOpen(false)} />}
    </div>
  )
}
