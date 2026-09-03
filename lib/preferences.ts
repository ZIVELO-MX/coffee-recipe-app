import { getDatabase } from "@/lib/db"
import { getGrinder, grinderName } from "@/lib/brewmark"
import { appearanceSchema, DEFAULT_AVATAR_APPEARANCE, type UserPreferences } from "@/lib/domain"

export const DEFAULT_PREFERENCES: UserPreferences = {
  temperature_unit: "C",
  default_grinder_id: 76,
  default_grinder_name: "Timemore C3",
  avatar: DEFAULT_AVATAR_APPEARANCE,
}

export async function getUserPreferences(userId?: string | null): Promise<UserPreferences> {
  if (!userId) return DEFAULT_PREFERENCES
  const document = await (await getDatabase()).collection("user_preferences").findOne({ clerk_user_id: userId })
  if (!document) return DEFAULT_PREFERENCES
  const defaultGrinderId = Number.isSafeInteger(document.default_grinder_id) && document.default_grinder_id > 0
    ? document.default_grinder_id
    : DEFAULT_PREFERENCES.default_grinder_id
  const avatar = appearanceSchema.safeParse(document.avatar)
  let defaultGrinderName: string | null = null
  try {
    defaultGrinderName = grinderName(await getGrinder(defaultGrinderId))
  } catch {
    if (defaultGrinderId === DEFAULT_PREFERENCES.default_grinder_id) defaultGrinderName = DEFAULT_PREFERENCES.default_grinder_name
  }
  return {
    temperature_unit: document.temperature_unit === "F" ? "F" : "C",
    default_grinder_id: defaultGrinderId,
    default_grinder_name: defaultGrinderName,
    avatar: avatar.success ? avatar.data : DEFAULT_AVATAR_APPEARANCE,
  }
}
