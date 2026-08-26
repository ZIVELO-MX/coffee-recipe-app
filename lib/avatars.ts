export type Avatar = {
  id: string
  src: string
  label: string
}

export const AVATARS: Avatar[] = [
  { id: "espresso", src: "/avatars/espresso.png", label: "Espresso" },
  { id: "bean", src: "/avatars/bean.png", label: "Grano" },
  { id: "moka", src: "/avatars/moka.png", label: "Moka" },
  { id: "v60", src: "/avatars/v60.png", label: "V60" },
  { id: "french-press", src: "/avatars/french-press.png", label: "Prensa francesa" },
  { id: "latte", src: "/avatars/latte.png", label: "Latte" },
  { id: "grinder", src: "/avatars/grinder.png", label: "Molino" },
  { id: "aeropress", src: "/avatars/aeropress.png", label: "AeroPress" },
]

export const DEFAULT_AVATAR = AVATARS[0]

export function getAvatar(id: string | null | undefined): Avatar {
  return AVATARS.find((a) => a.id === id) ?? DEFAULT_AVATAR
}
