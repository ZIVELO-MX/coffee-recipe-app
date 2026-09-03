# Koda Brew

Aplicación Next.js 16 para descubrir y ejecutar recetas de café en español.

## Desarrollo

Requiere Node 24 y pnpm 11.

\`\`\`sh
pnpm install --ignore-workspace --config.minimum-release-age=0
cp .env.example .env.local
pnpm dev
\`\`\`

Las rutas públicas de datos son `GET /api/recipes`, `GET /api/recipes/:id` y
`GET /api/grinders`. El contrato completo está disponible como OpenAPI 3.1 en
`GET /api/openapi.json`. Las operaciones de
administración están bajo `/api/admin/recipes` y requieren el token de servicio
o una sesión Clerk con `metadata.role=admin`.

## Crear recetas mediante API

Cada usuario autenticado puede crear una API key desde la sección
`Perfil → Desarrolladores`. Solo existe una clave activa por cuenta: Koda muestra
el secreto una vez, guarda únicamente su hash y al rotarlo invalida la clave
anterior inmediatamente.

`POST /api/recipes` publica una receta y requiere la clave como Bearer token. El
campo `author` no forma parte del body: Koda lo deriva del perfil asociado a la
clave.

```sh
curl --request POST https://tu-dominio.example/api/recipes \
  --header 'Authorization: Bearer koda_sk_REEMPLAZA_ESTA_CLAVE' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "V60 personal",
    "method": "v60",
    "coffee_g": 15,
    "water_ml": 250,
    "temperature_c": 93,
    "grind": { "grinder_id": 62, "setting": 28 },
    "preparation": ["Enjuagar el filtro y precalentar el equipo"],
    "steps": [
      { "instruction": "Bloom", "start": 0, "end": 45 },
      { "instruction": "Completar el vertido", "start": 45, "end": 150 }
    ]
  }'
```

## Verificación

\`\`\`sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
\`\`\`

Para poblar MongoDB localmente:

\`\`\`sh
pnpm db:indexes
pnpm db:seed
\`\`\`

El catálogo y las curvas de molinos proceden de BrewMark y se cachean durante
24 horas. Koda convierte en el backend el ajuste original de una receta al
molino seleccionado por el usuario; los clientes no descargan las curvas ni
persisten equivalencias. Las
credenciales se configuran únicamente mediante `.env.local`; nunca se
incluyen en commits.

## Datos y filtros

`pnpm db:seed` carga de forma idempotente la receta curada `V60 Regular`. La app
no usa fixtures en runtime: Buscar, Guardados y el detalle consultan MongoDB.
`GET /api/recipes` acepta filtros repetibles `method`, `coffee`, `water`,
`temperature` y `duration`, además de `q`, `page` y `pageSize`.

Cada receta persiste exclusivamente su molienda original como
`{ grinder_id, setting }`. `GET /api/recipes/:id?grinder=<id>` añade una
conversión efímera para el molino solicitado y distingue `grind.source` de
`grind.converted`. Sin el parámetro, solo devuelve la molienda original.

## Pruebas y despliegue

```sh
pnpm test:integration
pnpm test:e2e
```

Las pruebas de integración requieren `MONGODB_URI`. Playwright usa las claves
de una instancia Clerk de desarrollo y, para el flujo autenticado,
`CLERK_E2E_USER_EMAIL`. En GitHub deben configurarse como secretos junto con
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`.

Producción debe usar una base MongoDB y una instancia Clerk separadas de
desarrollo. Configura `MONGODB_URI`, `MONGODB_DB`, las claves de Clerk,
`RECIPE_ADMIN_API_TOKEN` y las rutas públicas de autenticación documentadas en
`.env.example`. Ejecuta `pnpm db:indexes` una vez contra la base productiva para
crear también los índices únicos de `api_keys`; ejecuta el seed solo cuando
corresponda inicializar las recetas curadas.

Después de que CI esté completamente verde, conecta el repositorio en Vercel,
registra el dominio resultante dentro de Clerk y realiza el smoke test de
producción.
