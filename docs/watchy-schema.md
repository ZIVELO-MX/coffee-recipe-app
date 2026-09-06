# Koda Brew → Watchy Recipe v1

Koda Brew exposes a stable, versioned representation for Watchy through:

- `GET /api/watchy/v1/recipes`
- `GET /api/watchy/v1/recipes/:id`

The contract is produced by an adapter. It does not expose MongoDB documents,
preparation instructions, grinder data, likes, viewer state, or internal fields.

## Recipe

`schemaVersion` is the compatibility discriminator and is currently always `1`.
Amounts use grams and milliliters. Times use integer seconds from the start of
the brew. `ratio` is a display string such as `1:13.3`.

```json
{
  "schemaVersion": 1,
  "id": "recipe-id",
  "brewMethod": "V60",
  "recipeName": "V60 Regular",
  "authorName": "Benji Rodriguez",
  "coffeeAmountGrams": 15,
  "waterAmountMl": 200,
  "ratio": "1:13.3",
  "totalBrewTimeSeconds": 150,
  "timedSteps": []
}
```

`preparation` remains available to Koda Brew clients but is intentionally not
part of this contract. Watchy receives the brew timeline only.

## Timed steps

Every exported step has `actionType`, an interval, and an `actionLabel`.

`pour` steps distinguish the water added during that step from the cumulative
target. For example, `waterAmountMl: 150` and `targetTotalWaterMl: 200` means
150 ml is poured and the total should reach 200 ml.

`wait` steps use either `waitUntilSeconds` for a time target or
`waitCondition: "drain_completely"` for a semantic condition. A
`hapticNotificationAtSeconds` value is optional and independent from the end
of the step; Koda Brew does not invent it.

Blooming is represented as `actionType: "pour"` with `actionLabel: "Blooming"`.
Normal pours use `actionLabel: "Pour"`; waits use `actionLabel: "Wait"`.

## Complete example

```json
{
  "schemaVersion": 1,
  "id": "recipe-id",
  "brewMethod": "V60",
  "recipeName": "V60 Regular",
  "authorName": "Benji Rodriguez",
  "coffeeAmountGrams": 15,
  "waterAmountMl": 200,
  "ratio": "1:13.3",
  "totalBrewTimeSeconds": 150,
  "timedSteps": [
    { "actionType": "pour", "startTimeSeconds": 0, "endTimeSeconds": 10, "waterAmountMl": 50, "targetTotalWaterMl": 50, "primaryValue": "50 ml", "actionLabel": "Blooming" },
    { "actionType": "wait", "startTimeSeconds": 10, "endTimeSeconds": 30, "waitUntilSeconds": 30, "actionLabel": "Wait", "secondaryValue": "Until 00:30" },
    { "actionType": "pour", "startTimeSeconds": 30, "endTimeSeconds": 40, "waterAmountMl": 150, "targetTotalWaterMl": 200, "primaryValue": "150 ml", "actionLabel": "Pour", "secondaryValue": "200 ml total" },
    { "actionType": "wait", "startTimeSeconds": 40, "endTimeSeconds": 150, "waitCondition": "drain_completely", "actionLabel": "Wait", "secondaryValue": "Drain completely" }
  ]
}
```

Recipes without explicit step semantics are valid Koda Brew recipes but are
not compatible with the Watchy detail endpoint and are omitted from the Watchy
list. Future incompatible changes require a new schema version and route.
