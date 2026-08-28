import { ImageResponse } from "next/og"
import { SocialImage, SOCIAL_IMAGE_SIZE } from "@/components/brand/social-image"

export const alt = "Koda Brew — Recetas de café de especialidad"
export const size = SOCIAL_IMAGE_SIZE
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(<SocialImage eyebrow="Recetas de especialidad" title="Prepara mejor café en casa" details="Descubre, guarda y sigue cada receta paso a paso." />, size)
}
