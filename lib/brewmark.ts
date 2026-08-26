import { z } from "zod"

const baseUrl = "https://brewmark.io"

const grinderSummarySchema = z.object({
  slug: z.string(),
  brand: z.string(),
  name: z.string(),
})

const grinderListSchema = z.object({
  grinders: z.array(grinderSummarySchema),
  count: z.number(),
})

const grinderChartSchema = z.object({
  slug: z.string(),
  brand: z.string(),
  name: z.string(),
  scale: z.string(),
  url: z.string().url(),
  methods: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      setting: z.string(),
      range: z.string(),
    }),
  ),
})

async function brewmarkFetch<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    next: { revalidate: 86400, tags: ["brewmark", `brewmark:${path}`] },
    signal: AbortSignal.timeout(3000),
  })
  if (!response.ok) throw new Error(`BrewMark returned ${response.status}`)
  return schema.parse(await response.json())
}

export function getGrinders() {
  return brewmarkFetch("/api/widget/grinders", grinderListSchema)
}

export function getGrinderChart(slug: string) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("Invalid grinder slug")
  return brewmarkFetch(`/api/widget/grinder/${slug}`, grinderChartSchema)
}
