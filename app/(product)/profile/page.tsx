import { auth, currentUser } from "@clerk/nextjs/server"
import { ProfileClient } from "@/components/wireframe/profile-client"
import { TabPageTransition } from "@/components/wireframe/tab-page-transition"
import { getUserPreferences } from "@/lib/preferences"
import type { ViewerUser } from "@/lib/domain"

export default async function ProfilePage() {
  const { userId } = await auth()
  const [clerkUser, preferences] = await Promise.all([userId ? currentUser() : null, getUserPreferences(userId)])
  const user: ViewerUser = clerkUser ? {
    name: clerkUser.fullName ?? clerkUser.firstName ?? "Cafetero",
    email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
    avatarId: "espresso",
  } : { name: "Invitado", email: "", avatarId: "espresso", guest: true }
  return <TabPageTransition><ProfileClient user={user} initialPreferences={preferences} /></TabPageTransition>
}
