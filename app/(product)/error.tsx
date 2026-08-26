"use client"

export default function ProductError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-3xl border border-border bg-card p-8 text-center">
        <h1 className="font-serif text-2xl font-bold">No pudimos cargar el café</h1>
        <p className="text-sm text-muted-foreground">Revisa tu conexión e inténtalo nuevamente.</p>
        <button type="button" onClick={reset} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Reintentar</button>
      </div>
    </main>
  )
}
