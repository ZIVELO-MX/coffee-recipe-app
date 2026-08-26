export type Method = "v60" | "chemex" | "aeropress" | "french-press" | "moka"

export type Step = {
  instruction: string
  start: number // segundos
  end: number // segundos
}

export type Recipe = {
  _id: string
  name: string
  author: string
  method: Method
  image: string
  coffee_g: number
  water_ml: number
  temperature_c: number
  grind: {
    target: string // ej. "18 clics"
    grinder: string // ej. "Timemore C3"
  }
  preparation: string[]
  steps: Step[]
  likes: number
  saved: boolean
}

export const METHOD_LABEL: Record<Method, string> = {
  v60: "V60",
  chemex: "Chemex",
  aeropress: "AeroPress",
  "french-press": "Prensa francesa",
  moka: "Moka",
}

export const RECIPES: Recipe[] = [
  {
    _id: "r1",
    name: "V60 clásico balanceado",
    author: "Ana Torres",
    method: "v60",
    image: "/methods/v60.png",
    coffee_g: 18,
    water_ml: 300,
    temperature_c: 93,
    grind: { target: "18 clics", grinder: "Timemore C3" },
    preparation: [
      "Enjuaga el filtro con agua caliente y desecha el agua.",
      "Añade el café molido y crea un pequeño cráter en el centro.",
      "Realiza el bloom con 50 ml y espera 30 segundos.",
      "Vierte en espiral hasta alcanzar los 300 ml.",
      "Deja drenar por completo antes de servir.",
    ],
    steps: [
      { instruction: "Bloom — vierte 50 ml", start: 0, end: 30 },
      { instruction: "Primer vertido — hasta 150 ml", start: 30, end: 75 },
      { instruction: "Segundo vertido — hasta 300 ml", start: 75, end: 120 },
      { instruction: "Drenado final", start: 120, end: 165 },
    ],
    likes: 128,
    saved: true,
  },
  {
    _id: "r2",
    name: "AeroPress invertido intenso",
    author: "Luis Gómez",
    method: "aeropress",
    image: "/methods/aeropress.png",
    coffee_g: 16,
    water_ml: 220,
    temperature_c: 85,
    grind: { target: "12 clics", grinder: "Timemore C3" },
    preparation: [
      "Monta la AeroPress en posición invertida.",
      "Añade el café y todo el agua.",
      "Revuelve 10 segundos y coloca la tapa con filtro.",
      "Voltea sobre la taza y presiona lentamente.",
    ],
    steps: [
      { instruction: "Vierte 220 ml y revuelve", start: 0, end: 20 },
      { instruction: "Reposo", start: 20, end: 80 },
      { instruction: "Voltea y presiona", start: 80, end: 110 },
    ],
    likes: 94,
    saved: true,
  },
  {
    _id: "r3",
    name: "Chemex para dos",
    author: "María Ruiz",
    method: "chemex",
    image: "/methods/chemex.png",
    coffee_g: 30,
    water_ml: 500,
    temperature_c: 94,
    grind: { target: "24 clics", grinder: "Comandante C40" },
    preparation: [
      "Coloca el filtro con la triple capa hacia el pico.",
      "Enjuaga y desecha el agua.",
      "Bloom con 60 ml durante 40 segundos.",
      "Vierte en etapas hasta 500 ml.",
    ],
    steps: [
      { instruction: "Bloom — 60 ml", start: 0, end: 40 },
      { instruction: "Vertido hasta 250 ml", start: 40, end: 100 },
      { instruction: "Vertido hasta 500 ml", start: 100, end: 160 },
      { instruction: "Drenado", start: 160, end: 240 },
    ],
    likes: 71,
    saved: false,
  },
  {
    _id: "r4",
    name: "Prensa francesa suave",
    author: "Carlos Díaz",
    method: "french-press",
    image: "/methods/french-press.png",
    coffee_g: 30,
    water_ml: 450,
    temperature_c: 92,
    grind: { target: "30 clics", grinder: "Timemore C3" },
    preparation: [
      "Añade el café molido grueso.",
      "Vierte toda el agua y revuelve la costra a los 4 min.",
      "Espera hasta los 8 minutos.",
      "Presiona el émbolo lentamente y sirve.",
    ],
    steps: [
      { instruction: "Vierte 450 ml", start: 0, end: 30 },
      { instruction: "Reposo", start: 30, end: 240 },
      { instruction: "Rompe la costra y revuelve", start: 240, end: 270 },
      { instruction: "Reposo final y presiona", start: 270, end: 480 },
    ],
    likes: 52,
    saved: false,
  },
  {
    _id: "r5",
    name: "Moka mañanera",
    author: "Sofía Peña",
    method: "moka",
    image: "/methods/moka.png",
    coffee_g: 20,
    water_ml: 150,
    temperature_c: 96,
    grind: { target: "10 clics", grinder: "Timemore C3" },
    preparation: [
      "Llena la base con agua caliente hasta la válvula.",
      "Coloca el café sin compactar.",
      "Cierra y pon a fuego medio.",
      "Retira cuando salga el gorgoteo.",
    ],
    steps: [
      { instruction: "Calentamiento", start: 0, end: 120 },
      { instruction: "Extracción", start: 120, end: 180 },
    ],
    likes: 38,
    saved: false,
  },
]

export type Grinder = {
  id: string
  brand: string
  model: string
}

export const GRINDERS: Grinder[] = [
  { id: "g1", brand: "Timemore", model: "Timemore C3" },
  { id: "g2", brand: "Timemore", model: "Timemore C2" },
  { id: "g3", brand: "Comandante", model: "Comandante C40" },
  { id: "g4", brand: "1Zpresso", model: "1Zpresso JX" },
  { id: "g5", brand: "1Zpresso", model: "1Zpresso K-Plus" },
  { id: "g6", brand: "Baratza", model: "Baratza Encore" },
]

export const DEFAULT_GRINDER = "Timemore C3"
