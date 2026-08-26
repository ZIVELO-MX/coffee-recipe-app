"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { BottomNav, type Tab } from "./bottom-nav"

export function ProductFrame({ active, children }: { active: Tab; children: ReactNode }) {
  const pathname = usePathname()
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem("coffee-recipe-origin")
    if (!raw) return
    try {
      const origin = JSON.parse(raw) as { path?: string; top?: number; recipeId?: string }
      const currentPath = `${window.location.pathname}${window.location.search}`
      if (origin.path !== currentPath || typeof origin.top !== "number") return
      requestAnimationFrame(() => {
        if (viewportRef.current) viewportRef.current.scrollTop = origin.top ?? 0
        if (origin.recipeId) {
          document.querySelector<HTMLElement>(`[data-recipe-id="${origin.recipeId}"]`)?.focus({ preventScroll: true })
        }
        sessionStorage.removeItem("coffee-recipe-origin")
      })
    } catch {
      sessionStorage.removeItem("coffee-recipe-origin")
    }
  }, [pathname])

  return (
    <main className="flex min-h-screen justify-center bg-background">
      <div className="relative flex h-[100dvh] w-full max-w-[400px] flex-col overflow-hidden bg-background sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-[2.5rem] sm:border sm:border-border sm:shadow-2xl">
        <div ref={viewportRef} data-product-scroll className="flex-1 overflow-y-auto">{children}</div>
        <BottomNav active={active} />
      </div>
    </main>
  )
}
