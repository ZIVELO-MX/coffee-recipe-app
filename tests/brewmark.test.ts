import { afterEach, describe, expect, it, vi } from "vitest"
import {
  assertValidGrind,
  BrewmarkUnavailableError,
  convertGrindSetting,
  getGrinderCatalog,
  GrinderNotFoundError,
  InvalidGrindSettingError,
  validateRecipeGrind,
  type BrewmarkGrinder,
} from "@/lib/brewmark"

const encoreEsp: BrewmarkGrinder = {
  id: 62,
  brand: "Baratza",
  name: "Encore ESP",
  minSetting: 1,
  maxSetting: 40,
  settingUnit: "NUMBER",
  espressoAnchor: 3,
  mokaAnchor: 8,
  filterAnchor: 18,
  frenchPressAnchor: 25,
  coarseAnchor: 33,
  burrType: "CONICAL",
}

const timemoreC3: BrewmarkGrinder = {
  id: 76,
  brand: "Timemore",
  name: "C3",
  minSetting: 0,
  maxSetting: 36,
  settingUnit: "CLICKS",
  espressoAnchor: 8,
  mokaAnchor: 12,
  filterAnchor: 20,
  frenchPressAnchor: 25,
  coarseAnchor: 32,
  burrType: "CONICAL",
}

afterEach(() => vi.unstubAllGlobals())

describe("BrewMark grinder conversion", () => {
  it("converts the authored Encore ESP setting to an actionable C3 click", () => {
    expect(convertGrindSetting(encoreEsp, 28, timemoreC3)).toBe(28)
  })

  it("returns the source setting for the same grinder", () => {
    expect(convertGrindSetting(encoreEsp, 28, encoreEsp)).toBe(28)
  })

  it("enforces catalog ranges and discrete click settings", () => {
    expect(() => assertValidGrind(timemoreC3, 12.5)).toThrow(InvalidGrindSettingError)
    expect(() => assertValidGrind(encoreEsp, 41)).toThrow(InvalidGrindSettingError)
  })

  it("parses the official catalog and validates a recipe grind", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ grinders: [encoreEsp, timemoreC3] })))))
    await expect(getGrinderCatalog()).resolves.toEqual({ grinders: [encoreEsp, timemoreC3] })
    await expect(validateRecipeGrind({ grinder_id: 62, setting: 28 })).resolves.toEqual(encoreEsp)
    await expect(validateRecipeGrind({ grinder_id: 999, setting: 28 })).rejects.toBeInstanceOf(GrinderNotFoundError)
  })

  it("normalizes transport and catalog failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
    await expect(getGrinderCatalog()).rejects.toBeInstanceOf(BrewmarkUnavailableError)
  })
})
