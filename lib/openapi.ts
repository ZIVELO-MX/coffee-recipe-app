import { z } from "zod"
import { personalRecipeInputSchema } from "@/lib/domain"

const { $schema: _jsonSchema, ...recipeCreateInput } = z.toJSONSchema(personalRecipeInputSchema)

const errorResponse = {
  description: "Error de la solicitud",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
    },
  },
}

const recipeFilters = [
  { name: "q", description: "Búsqueda por nombre o autor", schema: { type: "string" } },
  { name: "method", description: "Método repetible", schema: { type: "array", items: { $ref: "#/components/schemas/Method" } }, style: "form", explode: true },
  { name: "coffee", description: "Rango repetible, por ejemplo 15-20", schema: { type: "array", items: { type: "string" } }, style: "form", explode: true },
  { name: "water", description: "Rango repetible, por ejemplo 200-300", schema: { type: "array", items: { type: "string" } }, style: "form", explode: true },
  { name: "temperature", description: "Rango repetible en Celsius", schema: { type: "array", items: { type: "string" } }, style: "form", explode: true },
  { name: "duration", description: "Rango repetible en segundos", schema: { type: "array", items: { type: "string" } }, style: "form", explode: true },
  { name: "page", schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "pageSize", schema: { type: "integer", minimum: 1, maximum: 50, default: 20 } },
].map((parameter) => ({ in: "query", required: false, ...parameter }))

export const OPENAPI_DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "Koda Coffee API",
    version: "0.1.0",
    description: "API pública para consultar molinos y leer o crear recetas de café.",
  },
  servers: [{ url: "/", description: "Servidor actual" }],
  paths: {
    "/api/recipes": {
      get: {
        operationId: "listRecipes",
        summary: "Lista recetas públicas",
        parameters: recipeFilters,
        responses: {
          "200": {
            description: "Página de recetas",
            content: { "application/json": { schema: { $ref: "#/components/schemas/RecipePage" } } },
          },
          "400": errorResponse,
          "503": errorResponse,
        },
      },
      post: {
        operationId: "createRecipe",
        summary: "Crea y publica una receta",
        description: "El autor se obtiene del perfil asociado a la API key y no se acepta en el body.",
        security: [{ PersonalApiKey: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RecipeCreateInput" } } },
        },
        responses: {
          "201": {
            description: "Receta creada",
            content: { "application/json": { schema: { $ref: "#/components/schemas/RecipeCreated" } } },
          },
          "400": errorResponse,
          "401": errorResponse,
          "503": errorResponse,
        },
      },
    },
    "/api/recipes/{id}": {
      get: {
        operationId: "getRecipe",
        summary: "Obtiene una receta",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "grinder", in: "query", required: false, description: "ID BrewMark del molino destino", schema: { type: "integer", minimum: 1 } },
        ],
        responses: {
          "200": {
            description: "Receta solicitada",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Recipe" } } },
          },
          "400": errorResponse,
          "404": errorResponse,
          "503": errorResponse,
        },
      },
    },
    "/api/grinders": {
      get: {
        operationId: "listGrinders",
        summary: "Lista molinos disponibles",
        responses: {
          "200": {
            description: "Catálogo simplificado de molinos",
            content: { "application/json": { schema: { $ref: "#/components/schemas/GrinderPage" } } },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      PersonalApiKey: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "koda_sk_…",
        description: "API key personal creada desde Perfil.",
      },
    },
    schemas: {
      Method: {
        type: "string",
        enum: ["v60", "chemex", "aeropress", "french-press", "moka", "kalita"],
      },
      RecipeCreateInput: {
        ...recipeCreateInput,
        description: "Receta sin autor; Koda lo deriva del dueño de la API key.",
      },
      RecipeCreated: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: { id: { type: "string", description: "ObjectId de la receta" } },
      },
      GrindSetting: {
        type: "object",
        additionalProperties: false,
        required: ["grinder_id", "grinder_name", "setting", "setting_unit"],
        properties: {
          grinder_id: { type: "integer" },
          grinder_name: { type: ["string", "null"] },
          setting: { type: "number" },
          setting_unit: { type: ["string", "null"], enum: ["NUMBER", "CLICKS", "ROTATIONS", null] },
        },
      },
      Recipe: {
        type: "object",
        additionalProperties: false,
        required: ["_id", "name", "author", "method", "image", "coffee_g", "water_ml", "temperature_c", "grind", "preparation", "steps", "total_seconds", "like_count", "viewer_liked", "viewer_saved"],
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          author: { type: "string" },
          method: { $ref: "#/components/schemas/Method" },
          image: { type: "string" },
          coffee_g: { type: "number" },
          water_ml: { type: "number" },
          temperature_c: { type: "number" },
          grind: {
            type: "object",
            additionalProperties: false,
            required: ["source"],
            properties: {
              source: { $ref: "#/components/schemas/GrindSetting" },
              converted: { $ref: "#/components/schemas/GrindSetting" },
            },
          },
          preparation: { type: "array", items: { type: "string" } },
          steps: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["instruction", "start"],
              properties: {
                instruction: { type: "string" },
                start: { type: "integer" },
                end: { type: "integer" },
              },
            },
          },
          total_seconds: { type: "integer" },
          like_count: { type: "integer" },
          viewer_liked: { type: "boolean" },
          viewer_saved: { type: "boolean" },
        },
      },
      RecipePage: {
        type: "object",
        additionalProperties: false,
        required: ["data", "total", "page", "pageSize"],
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Recipe" } },
          total: { type: "integer" },
          page: { type: "integer" },
          pageSize: { type: "integer" },
        },
      },
      Grinder: {
        type: "object",
        additionalProperties: false,
        required: ["id", "brand", "name"],
        properties: {
          id: { type: "integer" },
          brand: { type: "string" },
          name: { type: "string" },
        },
      },
      GrinderPage: {
        type: "object",
        required: ["grinders", "count"],
        properties: {
          grinders: { type: "array", items: { $ref: "#/components/schemas/Grinder" } },
          count: { type: "integer" },
          source: { type: "string", enum: ["fallback"] },
        },
      },
      ErrorResponse: {
        type: "object",
        additionalProperties: false,
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              fields: { type: "object", additionalProperties: { type: "array", items: { type: "string" } } },
            },
          },
        },
      },
    },
  },
} as const
