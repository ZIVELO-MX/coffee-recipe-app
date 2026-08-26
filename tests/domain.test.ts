import { describe, expect, it } from "vitest"
import { activeStepIndex, totalSeconds, validateTimeline } from "@/lib/domain"

const steps = [
  { instruction: "Bloom", start: 0, end: 30 },
  { instruction: "Vierte", start: 30, end: 75 },
  { instruction: "Drena", start: 75, end: 120 },
]

describe("recipe timeline", () => {
  it("derives the total and active step from elapsed time", () => {
    expect(totalSeconds(steps)).toBe(120)
    expect(activeStepIndex(steps, 0)).toBe(0)
    expect(activeStepIndex(steps, 31)).toBe(1)
    expect(activeStepIndex(steps, 200)).toBe(2)
  })

  it("rejects unordered, overlapping and unfinished timelines", () => {
    expect(() => validateTimeline([{ instruction: "x", start: 0 }])).toThrow()
    expect(() => validateTimeline([
      { instruction: "x", start: 10, end: 30 },
      { instruction: "y", start: 20, end: 40 },
    ])).toThrow()
    expect(() => validateTimeline([
      { instruction: "x", start: 30, end: 40 },
      { instruction: "y", start: 10, end: 20 },
    ])).toThrow()
  })
})
