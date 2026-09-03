import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AvatarPickerDialog } from "@/components/wireframe/avatar-picker-dialog"

describe("avatar picker dialog", () => {
  it("saves the selected icon and background", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <AvatarPickerDialog
        open
        onOpenChange={vi.fn()}
        value={{ icon: "coffee", background: "caramel" }}
        onSave={onSave}
      />,
    )

    await user.click(screen.getByRole("radio", { name: "Grano" }))
    await user.click(screen.getByRole("radio", { name: "Oliva" }))
    await user.click(screen.getByRole("button", { name: "Guardar avatar" }))

    expect(onSave).toHaveBeenCalledWith({ icon: "bean", background: "olive" })
  })

  it("closes without saving when cancelled", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onSave = vi.fn()
    render(
      <AvatarPickerDialog
        open
        onOpenChange={onOpenChange}
        value={{ icon: "coffee", background: "caramel" }}
        onSave={onSave}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSave).not.toHaveBeenCalled()
  })
})
