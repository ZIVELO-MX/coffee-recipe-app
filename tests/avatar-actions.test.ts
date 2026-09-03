import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getDatabase: vi.fn(),
  revalidatePath: vi.fn(),
  updateOne: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("@/lib/db", () => ({ getDatabase: mocks.getDatabase }))

import { updateAvatar } from "@/app/actions"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ userId: "user_1" })
  mocks.getDatabase.mockResolvedValue({
    collection: vi.fn(() => ({ updateOne: mocks.updateOne })),
  })
})

describe("updateAvatar", () => {
  it("persists a curated avatar for the authenticated user", async () => {
    const avatar = { icon: "bean" as const, background: "olive" as const }
    await expect(updateAvatar(avatar)).resolves.toEqual({ ok: true, data: avatar })
    expect(mocks.updateOne).toHaveBeenCalledWith(
      { clerk_user_id: "user_1" },
      expect.objectContaining({ $set: expect.objectContaining({ avatar }) }),
      { upsert: true },
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile")
  })

  it("rejects unauthenticated and invalid updates", async () => {
    mocks.auth.mockResolvedValueOnce({ userId: null })
    await expect(updateAvatar({ icon: "coffee", background: "caramel" })).resolves.toMatchObject({
      ok: false,
      error: { code: "AUTH_REQUIRED" },
    })

    await expect(updateAvatar({ icon: "invalid", background: "caramel" } as never)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_INPUT" },
    })
    expect(mocks.updateOne).not.toHaveBeenCalled()
  })
})
