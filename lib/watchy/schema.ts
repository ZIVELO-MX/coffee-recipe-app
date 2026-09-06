import { z } from "zod"

const watchyPourSchema = z.object({
  actionType: z.literal("pour"),
  startTimeSeconds: z.number().int().min(0),
  endTimeSeconds: z.number().int().positive(),
  waterAmountMl: z.number().finite().positive(),
  targetTotalWaterMl: z.number().finite().positive(),
  hapticNotificationAtSeconds: z.number().int().min(0).optional(),
  primaryValue: z.string().min(1),
  actionLabel: z.string().min(1),
  secondaryValue: z.string().optional(),
}).strict()

const watchyWaitSchema = z.object({
  actionType: z.literal("wait"),
  startTimeSeconds: z.number().int().min(0),
  endTimeSeconds: z.number().int().positive(),
  waitUntilSeconds: z.number().int().positive().optional(),
  waitCondition: z.literal("drain_completely").optional(),
  hapticNotificationAtSeconds: z.number().int().min(0).optional(),
  actionLabel: z.string().min(1),
  primaryValue: z.string().optional(),
  secondaryValue: z.string().optional(),
}).strict()

export const watchyTimedStepSchema = z.discriminatedUnion("actionType", [watchyPourSchema, watchyWaitSchema]).superRefine((step, context) => {
  if (step.actionType === "wait" && step.waitUntilSeconds === undefined && step.waitCondition === undefined) {
    context.addIssue({ code: "custom", message: "A wait step needs a time or condition" })
  }
})
export type WatchyTimedStep = z.infer<typeof watchyTimedStepSchema>

export const watchyRecipeSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  brewMethod: z.string().min(1),
  recipeName: z.string().min(1),
  authorName: z.string().min(1).optional(),
  coffeeAmountGrams: z.number().finite().positive(),
  waterAmountMl: z.number().finite().positive(),
  ratio: z.string().regex(/^1:\d+(?:\.\d+)?$/),
  totalBrewTimeSeconds: z.number().int().positive(),
  timedSteps: z.array(watchyTimedStepSchema).min(1),
}).strict()
export type WatchyRecipe = z.infer<typeof watchyRecipeSchema>
