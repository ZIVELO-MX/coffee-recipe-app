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
  return (
    <nav
      aria-label="Navegación principal"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center pb-5"
    >
      <div className="glass-strong pointer-events-auto flex items-center gap-1 rounded-full p-1.5">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <Link
              key={id}
              href={HREF[id]}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className={isActive ? "inline" : "sr-only"}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
