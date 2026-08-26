"use client"

import { useState } from "react"
import { ScreenLogin } from "./screen-login"
import { ScreenRegister } from "./screen-register"
import { ScreenForgot } from "./screen-forgot"
import { ScreenAvatar } from "./screen-avatar"
import { DEFAULT_AVATAR } from "@/lib/avatars"

export type AuthUser = {
  name: string
  email: string
  avatarId: string
  guest?: boolean
}

type Step = "login" | "register" | "forgot" | "avatar"

export function AuthFlow({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [step, setStep] = useState<Step>("login")
  const [draft, setDraft] = useState<{ name: string; email: string }>({ name: "", email: "" })

  return (
    <div key={step} className="min-h-full">
      {step === "login" && (
        <ScreenLogin
          onLogin={(email) =>
            onAuthenticated({ name: email.split("@")[0], email, avatarId: DEFAULT_AVATAR.id })
          }
          onGoRegister={() => setStep("register")}
          onGoForgot={() => setStep("forgot")}
          onGuest={() =>
            onAuthenticated({
              name: "Invitado",
              email: "",
              avatarId: DEFAULT_AVATAR.id,
              guest: true,
            })
          }
        />
      )}

      {step === "register" && (
        <ScreenRegister
          onNext={(data) => {
            setDraft(data)
            setStep("avatar")
          }}
          onGoLogin={() => setStep("login")}
        />
      )}

      {step === "forgot" && <ScreenForgot onBack={() => setStep("login")} />}

      {step === "avatar" && (
        <ScreenAvatar
          name={draft.name}
          onBack={() => setStep("register")}
          onFinish={(avatarId) =>
            onAuthenticated({ name: draft.name, email: draft.email, avatarId })
          }
        />
      )}
    </div>
  )
}
