const MONGODB_SCHEME = /^mongodb(?:\+srv)?:\/\//

export function getMongoUri(value: string | undefined): string {
  const uri = value?.trim()

  if (!uri) {
    throw new Error("MONGODB_URI is not configured")
  }

  if (!MONGODB_SCHEME.test(uri)) {
    throw new Error(
      "MONGODB_URI must start with mongodb:// or mongodb+srv://. Configure only the raw URI, without MONGODB_URI= or surrounding quotes.",
    )
  }

  return uri
}
