import { ViewTransition, type ReactNode } from "react"

export function TabPageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ "tab-forward": "tab-forward", "tab-back": "tab-back", default: "none" }}
      exit={{ "tab-forward": "tab-forward", "tab-back": "tab-back", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  )
}
