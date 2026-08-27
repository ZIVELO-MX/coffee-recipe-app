import { RecipeCardsSkeleton } from "@/components/wireframe/recipe-card-skeleton"

export default function RecipesLoading() {
  return (
    <div className="flex flex-col gap-5 px-4 pb-32 pt-8">
      <div className="flex flex-col gap-2">
        <div className="h-4 w-24 animate-pulse rounded-full bg-secondary" />
        <div className="h-9 w-4/5 animate-pulse rounded-full bg-secondary" />
      </div>
      <div className="h-12 animate-pulse rounded-full bg-secondary" />
      <div className="h-10 animate-pulse rounded-full bg-secondary" />
      <RecipeCardsSkeleton />
    </div>
  )
}
