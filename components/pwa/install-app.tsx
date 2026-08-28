"use client"

import { Download, Share } from "lucide-react"
import { useEffect, useState } from "react"

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
}

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    setInstalled(isStandalone())
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent))

    const capturePrompt = (event: Event) => {
      event.preventDefault()
      setPrompt(event as InstallPromptEvent)
    }
    const markInstalled = () => {
      setInstalled(true)
      setPrompt(null)
    }
    window.addEventListener("beforeinstallprompt", capturePrompt)
    window.addEventListener("appinstalled", markInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt)
      window.removeEventListener("appinstalled", markInstalled)
    }
  }, [])

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const choice = await prompt.userChoice
    if (choice.outcome === "accepted") setPrompt(null)
  }

  if (installed) {
    return <p className="px-4 py-4 text-sm text-muted-foreground">Koda Brew ya está instalada en este dispositivo.</p>
  }

  if (prompt) {
    return (
      <button type="button" onClick={() => void install()} className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-secondary/50">
        <span>
          <span className="block text-sm font-medium text-foreground">Instalar Koda Brew</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">Ábrela como una app desde tu pantalla de inicio.</span>
        </span>
        <Download className="h-5 w-5 text-primary" aria-hidden="true" />
      </button>
    )
  }

  if (isIos) {
    return (
      <div className="flex items-start gap-3 px-4 py-4 text-sm">
        <Share className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-muted-foreground"><span className="font-medium text-foreground">Instala Koda Brew:</span> toca Compartir y después “Agregar a inicio”.</p>
      </div>
    )
  }

  return <p className="px-4 py-4 text-sm text-muted-foreground">Puedes instalar Koda Brew cuando tu navegador muestre la opción de instalación.</p>
}
