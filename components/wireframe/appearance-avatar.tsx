"use client"

import {
  Bean,
  Coffee,
  Droplets,
  Flame,
  Gauge,
  Scale,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Appearance, AppearanceBackground, AppearanceIcon } from "@/lib/domain"

export const APPEARANCE_ICONS: ReadonlyArray<{
  id: AppearanceIcon
  label: string
  icon: LucideIcon
}> = [
  { id: "coffee", label: "Taza", icon: Coffee },
  { id: "bean", label: "Grano", icon: Bean },
  { id: "droplets", label: "Gotas", icon: Droplets },
  { id: "flame", label: "Flama", icon: Flame },
  { id: "timer", label: "Temporizador", icon: Timer },
  { id: "scale", label: "Báscula", icon: Scale },
  { id: "gauge", label: "Medidor", icon: Gauge },
  { id: "sparkles", label: "Destellos", icon: Sparkles },
]

export const APPEARANCE_BACKGROUNDS: ReadonlyArray<{
  id: AppearanceBackground
  label: string
}> = [
  { id: "caramel", label: "Caramelo" },
  { id: "crema", label: "Crema" },
  { id: "terracotta", label: "Terracota" },
  { id: "olive", label: "Oliva" },
  { id: "mocha", label: "Moka" },
  { id: "slate", label: "Grafito" },
]

const ICONS = Object.fromEntries(APPEARANCE_ICONS.map((item) => [item.id, item.icon])) as Record<AppearanceIcon, LucideIcon>

const BACKGROUND_CLASSES: Record<AppearanceBackground, string> = {
  caramel: "bg-avatar-caramel text-avatar-caramel-foreground",
  crema: "bg-avatar-crema text-avatar-crema-foreground",
  terracotta: "bg-avatar-terracotta text-avatar-terracotta-foreground",
  olive: "bg-avatar-olive text-avatar-olive-foreground",
  mocha: "bg-avatar-mocha text-avatar-mocha-foreground",
  slate: "bg-avatar-slate text-avatar-slate-foreground",
}

const SIZE_CLASSES = {
  sm: "size-12 [&_svg]:size-5",
  md: "size-16 [&_svg]:size-7",
  lg: "size-24 [&_svg]:size-10",
} as const

export function appearanceBackgroundClass(background: AppearanceBackground): string {
  return BACKGROUND_CLASSES[background]
}

export function AppearanceAvatar({
  appearance,
  size = "md",
  className,
}: {
  appearance: Appearance
  size?: keyof typeof SIZE_CLASSES
  className?: string
}) {
  const Icon = ICONS[appearance.icon]

  return (
    <Avatar aria-hidden="true" className={cn(SIZE_CLASSES[size], "ring-1 ring-white/10", className)}>
      <AvatarFallback className={cn("bg-opacity-100", BACKGROUND_CLASSES[appearance.background])}>
        <Icon strokeWidth={1.8} />
      </AvatarFallback>
    </Avatar>
  )
}
