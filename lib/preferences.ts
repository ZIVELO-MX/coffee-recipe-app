import { getDatabase } from "@/lib/db"
import type { UserPreferences } from "@/lib/domain"

export const DEFAULT_PREFERENCES: UserPreferences = {
  temperature_unit: "C",
  default_grinder_slug: "timemore-c3",
  default_grinder_name: "Timemore C3",
}

export async function getUserPreferences(userId?: string | null): Promise<UserPreferences> {
  if (!userId) return DEFAULT_PREFERENCES
  const document = await (await getDatabase()).collection("user_preferences").findOne({ clerk_user_id: userId })
  if (!document) return DEFAULT_PREFERENCES
  return {
    temperature_unit: document.temperature_unit === "F" ? "F" : "C",
    default_grinder_slug: document.default_grinder_slug ?? DEFAULT_PREFERENCES.default_grinder_slug,
    default_grinder_name: document.default_grinder_name ?? DEFAULT_PREFERENCES.default_grinder_name,
  }
}
