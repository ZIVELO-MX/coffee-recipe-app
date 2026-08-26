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
