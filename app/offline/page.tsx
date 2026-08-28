import type { Metadata } from "next"
import { RefreshCw, WifiOff } from "lucide-react"
import Link from "next/link"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export const metadata: Metadata = {
  title: "Sin conexión",
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-6 py-10 [padding-bottom:max(2.5rem,env(safe-area-inset-bottom))] [padding-top:max(2.5rem,env(safe-area-inset-top))]">
      <Empty className="max-w-md rounded-3xl border border-border bg-card/70">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-14 rounded-2xl bg-primary/15 text-primary">
            <WifiOff className="size-7" aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle className="font-serif text-2xl font-bold">Estás sin conexión</EmptyTitle>
          <EmptyDescription>Conéctate a internet para volver a explorar tus recetas en Koda Brew.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/recipes" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <RefreshCw className="size-4" aria-hidden="true" />Intentar de nuevo
          </Link>
        </EmptyContent>
      </Empty>
    </main>
  )
}
