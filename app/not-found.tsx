import Link from "next/link"

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-background p-6"><div className="text-center"><h1 className="font-serif text-3xl font-bold">Receta no encontrada</h1><Link href="/recipes" className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Volver a recetas</Link></div></main>
}
