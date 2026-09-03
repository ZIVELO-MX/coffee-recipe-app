import type { RecipeInput } from "@/lib/domain"

export type SeedRecipe = RecipeInput & { legacy_id: string }

export const SEED_RECIPES: SeedRecipe[] = [
  {
    legacy_id: "r6",
    name: "V60 Regular",
    author: "Benji Rodriguez",
    method: "v60",
    image: "/methods/v60-benji.png",
    coffee_g: 15,
    water_ml: 200,
    temperature_c: 80,
    grind: { grinder_id: 62, setting: 28 },
    preparation: [
      "Pesa 15 g de café.",
      "Ajusta el Baratza Encore ESP a 28.",
      "Calienta 200 ml de agua a 80 °C.",
    ],
    steps: [
      { instruction: "Vierte 50 ml de agua para el blooming.", start: 0, end: 10 },
      { instruction: "Espera hasta los 30 segundos.", start: 10, end: 30 },
      { instruction: "Vierte 150 ml de agua hasta alcanzar 200 ml totales.", start: 30, end: 40 },
      { instruction: "Deja drenar completamente.", start: 40, end: 150 },
    ],
  },
]
