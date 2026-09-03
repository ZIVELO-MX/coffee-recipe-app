"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { AppearanceAvatar, APPEARANCE_BACKGROUNDS, APPEARANCE_ICONS, appearanceBackgroundClass } from "./appearance-avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import type { Appearance, AppearanceBackground, AppearanceIcon } from "@/lib/domain"
import { cn } from "@/lib/utils"

export function AvatarPickerDialog({
  open,
  onOpenChange,
  value,
  onSave,
  pending = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: Appearance
  onSave: (value: Appearance) => void
  pending?: boolean
}) {
  const [draft, setDraft] = useState(value)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader className="items-center text-center sm:text-center">
          <AppearanceAvatar appearance={draft} size="lg" className="mb-2 shadow-[0_16px_44px_-20px_var(--primary)]" />
          <DialogTitle className="font-serif text-2xl">Elige tu avatar</DialogTitle>
          <DialogDescription>Combina un símbolo de café con un color de fondo.</DialogDescription>
        </DialogHeader>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Icono</legend>
          <RadioGroup
            aria-label="Icono del avatar"
            value={draft.icon}
            onValueChange={(icon) => setDraft((current) => ({ ...current, icon: icon as AppearanceIcon }))}
            className="grid grid-cols-4 gap-3"
          >
            {APPEARANCE_ICONS.map(({ id, label, icon: Icon }) => (
              <RadioGroupItem
                key={id}
                value={id}
                aria-label={label}
                className="relative size-14 rounded-2xl border-border bg-secondary text-muted-foreground transition-[background-color,color,border-color,box-shadow,transform] hover:bg-accent hover:text-foreground active:scale-[0.97] data-[state=checked]:border-primary data-[state=checked]:bg-accent data-[state=checked]:text-primary data-[state=checked]:shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--ring)] [&_[data-slot=radio-group-indicator]]:absolute [&_[data-slot=radio-group-indicator]]:right-1.5 [&_[data-slot=radio-group-indicator]]:top-1.5 [&_[data-slot=radio-group-indicator]_svg]:size-2"
              >
                <Icon className="size-6" strokeWidth={1.8} />
              </RadioGroupItem>
            ))}
          </RadioGroup>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Color de fondo</legend>
          <RadioGroup
            aria-label="Color de fondo del avatar"
            value={draft.background}
            onValueChange={(background) => setDraft((current) => ({ ...current, background: background as AppearanceBackground }))}
            className="grid grid-cols-6 gap-3"
          >
            {APPEARANCE_BACKGROUNDS.map(({ id, label }) => (
              <RadioGroupItem
                key={id}
                value={id}
                aria-label={label}
                className={cn(
                  "relative size-11 rounded-full border-2 border-background transition-[border-color,box-shadow,transform] hover:scale-105 active:scale-[0.97] data-[state=checked]:border-background data-[state=checked]:shadow-[0_0_0_2px_var(--ring)] [&_[data-slot=radio-group-indicator]]:absolute [&_[data-slot=radio-group-indicator]]:inset-0 [&_[data-slot=radio-group-indicator]]:flex [&_[data-slot=radio-group-indicator]]:items-center [&_[data-slot=radio-group-indicator]]:justify-center [&_[data-slot=radio-group-indicator]_svg]:hidden",
                  appearanceBackgroundClass(id),
                )}
              >
                {draft.background === id && <Check className="size-5" strokeWidth={2.5} />}
              </RadioGroupItem>
            ))}
          </RadioGroup>
        </fieldset>

        <DialogFooter className="mt-2 sm:flex-row">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={pending}>Cancelar</Button>
          <Button type="button" className="flex-1" onClick={() => onSave(draft)} disabled={pending}>
            {pending && <Spinner data-icon="inline-start" />}
            Guardar avatar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
