import type { ReactNode } from "react"
import { BottomNav, type Tab } from "./bottom-nav"

export function ProductFrame({ active, children }: { active: Tab; children: ReactNode }) {
  return (
    <main className="flex min-h-screen justify-center bg-background">
      <div className="relative flex h-[100dvh] w-full max-w-[400px] flex-col overflow-hidden bg-background sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-[2.5rem] sm:border sm:border-border sm:shadow-2xl">
        <div className="flex-1 overflow-y-auto">{children}</div>
        <BottomNav active={active} />
      </div>
    </main>
  )
}
