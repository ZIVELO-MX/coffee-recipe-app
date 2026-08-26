import type { ReactNode } from "react"

export default function ProductLayout({ children, recipe }: { children: ReactNode; recipe: ReactNode }) {
  return <>{children}{recipe}</>
}
