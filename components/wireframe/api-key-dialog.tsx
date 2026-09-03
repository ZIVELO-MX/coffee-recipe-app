"use client"

import { useRef, useState, useTransition } from "react"
import { Check, Copy, ExternalLink, KeyRound, RefreshCw, TriangleAlert } from "lucide-react"
import { createRecipeApiKey, rotateRecipeApiKey } from "@/app/api-key-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { ApiKeyStatus } from "@/lib/domain"

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeZone: "America/Mexico_City",
})

export function ApiKeyDialog({
  open,
  onOpenChange,
  status,
  onStatusChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: ApiKeyStatus
  onStatusChange: (status: ApiKeyStatus) => void
}) {
  const [issuedKey, setIssuedKey] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [copyMessage, setCopyMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  const keyInput = useRef<HTMLInputElement>(null)

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen && isPending) return
    if (!nextOpen) {
      setIssuedKey(null)
      setError("")
      setCopyMessage("")
    }
    onOpenChange(nextOpen)
  }

  function issue(mode: "create" | "rotate") {
    setError("")
    setCopyMessage("")
    startTransition(async () => {
      const result = mode === "create" ? await createRecipeApiKey() : await rotateRecipeApiKey()
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      setIssuedKey(result.data.api_key)
      onStatusChange(result.data.status)
    })
  }

  async function copyKey() {
    if (!issuedKey) return
    try {
      await navigator.clipboard.writeText(issuedKey)
      setCopyMessage("API key copiada.")
    } catch {
      keyInput.current?.focus()
      keyInput.current?.select()
      setCopyMessage("No se pudo copiar automáticamente. La clave quedó seleccionada.")
    }
  }

  const statusDate = status.has_key ? status.rotated_at ?? status.created_at : null

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <KeyRound aria-hidden="true" />
            API key para recetas
          </DialogTitle>
          <DialogDescription>
            Usa esta clave para publicar recetas mediante <code>POST /api/recipes</code>.
          </DialogDescription>
        </DialogHeader>

        {issuedKey ? (
          <div className="flex flex-col gap-4">
            <Alert>
              <TriangleAlert aria-hidden="true" />
              <AlertTitle>Guárdala ahora</AlertTitle>
              <AlertDescription>Por seguridad, Koda no volverá a mostrar esta clave.</AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <label htmlFor="issued-api-key" className="text-sm font-medium text-foreground">Nueva API key</label>
              <div className="flex gap-2">
                <Input
                  ref={keyInput}
                  id="issued-api-key"
                  value={issuedKey}
                  readOnly
                  spellCheck={false}
                  autoComplete="off"
                  className="font-mono text-xs"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => void copyKey()} aria-label="Copiar API key">
                  {copyMessage === "API key copiada." ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                </Button>
              </div>
              <p role="status" aria-live="polite" className="min-h-5 text-xs text-muted-foreground">{copyMessage}</p>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => changeOpen(false)}>Entendido</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <TriangleAlert aria-hidden="true" />
                <AlertTitle>No se pudo completar la operación</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {status.has_key ? (
              <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
                <p className="font-mono text-sm text-foreground">koda_sk_••••••••{status.last_four}</p>
                <p className="text-xs text-muted-foreground">
                  {status.rotated_at ? "Rotada" : "Creada"} el {dateFormatter.format(new Date(statusDate!))}
                </p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Crea una clave personal para integrar Koda con scripts y otras herramientas. Solo tendrás una clave activa.
              </p>
            )}

            <Button variant="outline" asChild>
              <a href="/api/openapi.json" target="_blank" rel="noreferrer">
                Ver documentación OpenAPI
                <ExternalLink data-icon="inline-end" aria-hidden="true" />
              </a>
            </Button>

            <DialogFooter>
              {status.has_key ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" disabled={isPending}>
                      {isPending ? <Spinner data-icon="inline-start" aria-label="Rotando API key" /> : <RefreshCw data-icon="inline-start" aria-hidden="true" />}
                      Rotar API key
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Rotar la API key?</AlertDialogTitle>
                      <AlertDialogDescription>
                        La clave actual dejará de funcionar inmediatamente. Tendrás que actualizar cualquier integración que la utilice.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => issue("rotate")}>Rotar clave</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button type="button" onClick={() => issue("create")} disabled={isPending}>
                  {isPending ? <Spinner data-icon="inline-start" aria-label="Creando API key" /> : <KeyRound data-icon="inline-start" aria-hidden="true" />}
                  Crear API key
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
