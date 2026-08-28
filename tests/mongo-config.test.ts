import { describe, expect, it } from "vitest"
import { getMongoUri } from "@/lib/mongo-config"

describe("getMongoUri", () => {
  it("accepts standard and SRV MongoDB connection strings", () => {
    expect(getMongoUri("mongodb://127.0.0.1:27017")).toBe("mongodb://127.0.0.1:27017")
    expect(getMongoUri("mongodb+srv://user:password@example.mongodb.net/database")).toBe(
      "mongodb+srv://user:password@example.mongodb.net/database",
    )
  })

  it("trims harmless surrounding whitespace", () => {
    expect(getMongoUri("  mongodb://127.0.0.1:27017  ")).toBe("mongodb://127.0.0.1:27017")
  })

  it("rejects missing values", () => {
    expect(() => getMongoUri(undefined)).toThrow("MONGODB_URI is not configured")
    expect(() => getMongoUri("   ")).toThrow("MONGODB_URI is not configured")
  })

  it.each([
    '"mongodb+srv://example.mongodb.net"',
    "MONGODB_URI=mongodb+srv://example.mongodb.net",
    "https://example.mongodb.net",
  ])("rejects a malformed value without exposing it: %s", (value) => {
    expect(() => getMongoUri(value)).toThrow(
      "MONGODB_URI must start with mongodb:// or mongodb+srv://",
    )
  })
})
