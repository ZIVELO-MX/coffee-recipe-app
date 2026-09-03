import { clerkClient } from "@clerk/nextjs/server"

type ViewerIdentity = { fullName: string | null; firstName: string | null }

export function viewerDisplayName(user: ViewerIdentity): string {
  return user.fullName?.trim() || user.firstName?.trim() || "Cafetero"
}

export async function getViewerDisplayName(userId: string): Promise<string> {
  const user = await (await clerkClient()).users.getUser(userId)
  return viewerDisplayName(user)
}
