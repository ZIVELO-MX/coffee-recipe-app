export function RecipeCardSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex items-center gap-4 p-5 pb-4">
        <div className="size-16 shrink-0 animate-pulse rounded-full bg-secondary" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="h-3 w-16 animate-pulse rounded-full bg-secondary" />
          <div className="h-5 w-3/4 animate-pulse rounded-full bg-secondary" />
          <div className="h-4 w-2/5 animate-pulse rounded-full bg-secondary" />
        </div>
        <div className="size-10 shrink-0 animate-pulse rounded-full bg-secondary" />
      </div>
        <div className="flex items-center gap-3 border-t border-border px-5 py-4">
          <div className="h-3 w-12 animate-pulse rounded-full bg-secondary" />
          <div className="h-3 w-16 animate-pulse rounded-full bg-secondary" />
          <div className="ml-auto h-3 w-10 animate-pulse rounded-full bg-secondary" />
      </div>
    </div>
  )
}

export function RecipeCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-label="Cargando recetas" role="status">
      {Array.from({ length: count }, (_, index) => <RecipeCardSkeleton key={index} />)}
    </div>
  )
}
