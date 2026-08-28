import type { ReactElement } from "react"

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 }

export function SocialImage({ title, eyebrow, details }: { title: string; eyebrow: string; details?: string }): ReactElement {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", background: "#1a1712", color: "#f8f4ec", padding: "68px 76px" }}>
      <div style={{ position: "absolute", width: 640, height: 640, right: -180, top: -260, borderRadius: 999, background: "radial-gradient(circle, rgba(226,154,69,.28), rgba(226,154,69,0) 68%)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 70, height: 70, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 22, background: "#e29a45", color: "#2b1c0d", fontSize: 42, fontWeight: 800 }}>K</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 28, fontWeight: 700 }}>Koda Brew</span>
          <span style={{ fontSize: 18, color: "#bdb4a7" }}>Café, paso a paso</span>
        </div>
      </div>
      <div style={{ display: "flex", maxWidth: 930, flexDirection: "column", gap: 20 }}>
        <span style={{ color: "#e29a45", fontSize: 22, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>{eyebrow}</span>
        <span style={{ fontSize: title.length > 42 ? 58 : 70, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }}>{title}</span>
        {details && <span style={{ color: "#cfc7bb", fontSize: 25 }}>{details}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#8f867a", fontSize: 18 }}>
        <span style={{ width: 38, height: 20, display: "flex", borderRadius: "50%", border: "3px solid #e29a45", transform: "rotate(-24deg)" }} />
        <span>brew.zivelo.dev</span>
      </div>
    </div>
  )
}
