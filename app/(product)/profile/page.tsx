import { auth, currentUser } from "@clerk/nextjs/server"
import { ProfileClient } from "@/components/wireframe/profile-client"
import { TabPageTransition } from "@/components/wireframe/tab-page-transition"
import { getUserPreferences } from "@/lib/preferences"
import { getApiKeyStatus } from "@/lib/api-keys"
import type { ViewerUser } from "@/lib/domain"
import { viewerDisplayName } from "@/lib/viewer"

export default async function ProfilePage() {
  const { userId } = await auth()
  const [clerkUser, preferences, apiKeyStatus] = await Promise.all([
    userId ? currentUser() : null,
    getUserPreferences(userId),
    getApiKeyStatus(userId),
  ])
  const user: ViewerUser = clerkUser ? {
    name: viewerDisplayName(clerkUser),
    email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
  } : { name: "Invitado", email: "", guest: true }
  return <TabPageTransition><ProfileClient user={user} initialPreferences={preferences} initialApiKeyStatus={apiKeyStatus} /></TabPageTransition>
}
