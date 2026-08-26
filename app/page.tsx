"use client"

import { useState } from "react"
import { BottomNav, type Tab } from "@/components/wireframe/bottom-nav"
import { ScreenBuscar } from "@/components/wireframe/screen-buscar"
import { ScreenGuardados } from "@/components/wireframe/screen-guardados"
import { ScreenPerfil } from "@/components/wireframe/screen-perfil"
import { RecipeSheet } from "@/components/wireframe/recipe-sheet"
import { GrinderSelector } from "@/components/wireframe/grinder-selector"
import { AuthFlow, type AuthUser } from "@/components/auth/auth-flow"
import { DEFAULT_GRINDER, RECIPES } from "@/lib/mock-data"

export default function Page({ initialTab = "buscar" }: { initialTab?: Tab }) {
  const [user, setUser] = useState<AuthUser | null>({
    name: "Invitado",
    email: "",
    avatarId: "espresso",
    guest: true,
  })
  const [tab, setTab] = useState<Tab>(initialTab)
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null)
  const [grinderOpen, setGrinderOpen] = useState(false)
  const [grinder, setGrinder] = useState(DEFAULT_GRINDER)
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C")
  const [savedIds, setSavedIds] = useState<string[]>(() =>
    RECIPES.filter((recipe) => recipe.saved).map((recipe) => recipe._id),
  )

  const openRecipe = RECIPES.find((r) => r._id === openRecipeId) ?? null

  function handleOpen(id: string) {
    setOpenRecipeId(id)
  }

  function handleLogout() {
    setUser(null)
    setTab("buscar")
    setOpenRecipeId(null)
  }

  return (
    <main className="flex min-h-screen justify-center bg-background">
      {/* Contenedor tipo teléfono */}
      <div className="relative flex h-[100dvh] w-full max-w-[400px] flex-col overflow-hidden bg-background sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-[2.5rem] sm:border sm:border-border sm:shadow-2xl">
        {!user ? (
          <div className="flex-1 overflow-y-auto">
            <AuthFlow onAuthenticated={setUser} />
          </div>
        ) : (
          <>
        {/* Pantalla de origen: permanece montada detrás del sheet */}
        <div className="flex-1 overflow-y-auto">
          {tab === "buscar" ? (
            <ScreenBuscar onOpen={handleOpen} savedIds={savedIds} />
          ) : tab === "guardados" ? (
            <ScreenGuardados onOpen={handleOpen} savedIds={savedIds} />
          ) : (
            <ScreenPerfil
              user={user}
              grinder={grinder}
              tempUnit={tempUnit}
              onOpenGrinder={() => setGrinderOpen(true)}
              onToggleUnit={setTempUnit}
              onLogout={handleLogout}
            />
          )}
        </div>

        <BottomNav
          active={tab}
          onChange={(t) => {
            setTab(t)
            setOpenRecipeId(null)
          }}
        />

        {/* Bottom sheet de receta superpuesto */}
        {openRecipe && (
          <RecipeSheet
            key={openRecipe._id}
            recipe={openRecipe}
            tempUnit={tempUnit}
            onToggleUnit={setTempUnit}
            onOpenGrinder={() => setGrinderOpen(true)}
            onClose={() => setOpenRecipeId(null)}
            onSavedChange={(saved) => {
              setSavedIds((current) =>
                saved
                  ? [...new Set([...current, openRecipe._id])]
                  : current.filter((id) => id !== openRecipe._id),
              )
            }}
          />
        )}

        {grinderOpen && (
          <GrinderSelector
            selected={grinder}
            onSelect={setGrinder}
            onClose={() => setGrinderOpen(false)}
          />
        )}
          </>
        )}
      </div>
    </main>
  )
}
