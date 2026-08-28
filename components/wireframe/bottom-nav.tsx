"use client"

import { Bookmark, Search, User } from "lucide-react"
import Link from "next/link"

export type Tab = "guardados" | "buscar" | "perfil"

const ITEMS: { id: Tab; label: string; icon: typeof Search }[] = [
  { id: "guardados", label: "Guardados", icon: Bookmark },
  { id: "buscar", label: "Buscar", icon: Search },
  { id: "perfil", label: "Perfil", icon: User },
]

const HREF: Record<Tab, string> = { guardados: "/saved", buscar: "/recipes", perfil: "/profile" }

export function BottomNav({
  active,
}: {
  active: Tab
}) {
  const activeIndex = ITEMS.findIndex((item) => item.id === active)
  return (
    <nav
      aria-label="Navegación principal"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center [padding-bottom:max(1.25rem,env(safe-area-inset-bottom))]"
    >
      <div className="glass-strong pointer-events-auto relative grid w-[calc(100vw-2rem)] max-w-[352px] grid-cols-3 rounded-full p-1.5">
        <span
          aria-hidden="true"
          className="absolute inset-y-1.5 left-1.5 w-[calc((100%_-_0.75rem)/3)] rounded-full bg-primary shadow-lg transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          const targetIndex = ITEMS.findIndex((item) => item.id === id)
          return (
            <Link
              key={id}
              href={HREF[id]}
              transitionTypes={[targetIndex > activeIndex ? "tab-forward" : "tab-back"]}
              aria-current={isActive ? "page" : undefined}
              className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-xs font-medium transition-colors duration-300 ${
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
