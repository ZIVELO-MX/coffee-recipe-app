# Coffee Recipe App

Aplicación Next.js 16 para descubrir y ejecutar recetas de café en español.

## Desarrollo

Requiere Node 24 y pnpm 11.

\`\`\`sh
pnpm install --ignore-workspace --config.minimum-release-age=0
cp .env.example .env.local
pnpm dev
\`\`\`

Las rutas públicas de datos son `GET /api/recipes`, `GET /api/recipes/:id`,
`GET /api/grinders` y `GET /api/grinders/:slug`. Las operaciones de
administración están bajo `/api/admin/recipes` y requieren el token de servicio
o una sesión Clerk con `metadata.role=admin`.

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

El catálogo de molinos procede de BrewMark y se cachea durante 24 horas. Las
credenciales se configuran únicamente mediante `.env.local`; nunca se
incluyen en commits.

## Datos y filtros

`pnpm db:seed` carga de forma idempotente las cinco recetas iniciales. La app
no usa fixtures en runtime: Buscar, Guardados y el detalle consultan MongoDB.
`GET /api/recipes` acepta filtros repetibles `method`, `coffee`, `water`,
`temperature` y `duration`, además de `q`, `page` y `pageSize`.

## Pruebas y despliegue

```sh
pnpm test:integration
pnpm test:e2e
```

Las pruebas de integración requieren `MONGODB_URI`. Playwright usa las claves
de una instancia Clerk de desarrollo y, para el flujo autenticado,
`CLERK_E2E_USER_EMAIL`. En GitHub deben configurarse como secretos junto con
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`.

Para Vercel configura `MONGODB_URI`, `MONGODB_DB`, las claves de la instancia
Clerk de producción y `RECIPE_ADMIN_API_TOKEN`. Después registra el dominio de
Vercel dentro de Clerk y ejecuta índices/seed una vez contra la base productiva.
