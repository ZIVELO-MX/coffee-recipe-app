import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const actions = vi.hoisted(() => ({
  createRecipeApiKey: vi.fn(),
  rotateRecipeApiKey: vi.fn(),
}))

vi.mock("@/app/api-key-actions", () => actions)

import { ApiKeyDialog } from "@/components/wireframe/api-key-dialog"

const issued = {
  api_key: "koda_sk_abcdefghijklmnopqrstuvwxyzABCDEFGH123456789",
  status: {
    has_key: true as const,
    last_four: "6789",
    created_at: "2026-09-03T12:00:00.000Z",
    rotated_at: null,
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  actions.createRecipeApiKey.mockResolvedValue({ ok: true, data: issued })
  actions.rotateRecipeApiKey.mockResolvedValue({
    ok: true,
    data: { ...issued, status: { ...issued.status, rotated_at: "2026-09-03T13:00:00.000Z" } },
  })
})

describe("API key dialog", () => {
  it("creates and reveals a key only inside the current dialog session", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onStatusChange = vi.fn()
    const view = render(
      <ApiKeyDialog open onOpenChange={onOpenChange} status={{ has_key: false }} onStatusChange={onStatusChange} />,
    )

    await user.click(screen.getByRole("button", { name: "Crear API key" }))
    expect(await screen.findByLabelText("Nueva API key")).toHaveValue(issued.api_key)
    expect(onStatusChange).toHaveBeenCalledWith(issued.status)

    await user.click(screen.getByRole("button", { name: "Entendido" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)

    view.rerender(
      <ApiKeyDialog open onOpenChange={onOpenChange} status={issued.status} onStatusChange={onStatusChange} />,
    )
    await waitFor(() => expect(screen.queryByDisplayValue(issued.api_key)).not.toBeInTheDocument())
  })

  it("requires confirmation before rotating an existing key", async () => {
    const user = userEvent.setup()
    render(<ApiKeyDialog open onOpenChange={vi.fn()} status={issued.status} onStatusChange={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "Rotar API key" }))
    expect(screen.getByRole("alertdialog")).toHaveTextContent("La clave actual dejará de funcionar inmediatamente")
    expect(actions.rotateRecipeApiKey).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Rotar clave" }))
    await waitFor(() => expect(actions.rotateRecipeApiKey).toHaveBeenCalledOnce())
    expect(await screen.findByLabelText("Nueva API key")).toBeVisible()
  })
})
