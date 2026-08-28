import { ImageResponse } from "next/og"
import { SocialImage, SOCIAL_IMAGE_SIZE } from "@/components/brand/social-image"
import { getRecipeShareData } from "@/lib/recipes"

export const alt = "Receta en Koda Brew"
export const size = SOCIAL_IMAGE_SIZE
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  let recipe = null
  try {
    recipe = await getRecipeShareData((await params).id)
  } catch {
    // Las tarjetas compartidas conservan la marca aunque la base esté temporalmente inaccesible.
  }

  return new ImageResponse(
    recipe
      ? <SocialImage eyebrow={recipe.method} title={recipe.name} details={`por ${recipe.author} · ${recipe.coffeeGrams} g / ${recipe.waterMilliliters} ml · ${Math.ceil(recipe.totalSeconds / 60)} min`} />
      : <SocialImage eyebrow="Receta de especialidad" title="Prepara mejor café en casa" details="Consulta esta receta en Koda Brew." />,
    size,
  )
}
