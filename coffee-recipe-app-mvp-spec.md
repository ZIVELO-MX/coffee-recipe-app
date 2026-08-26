# Coffee Recipe App — MVP Product & Implementation Plan

> **Execution status (2026-08-25):** Foundation complete. Git is initialized,
> the prototype metadata has been removed, MongoDB/Clerk/BrewMark contracts
> exist, and `pnpm typecheck`, `pnpm test`, `pnpm lint`, and `pnpm build` pass.
> The remaining work is tracked as the ordered milestones below.

## Actionable milestones

- [x] **M0 — Repository and quality baseline:** initialize Git, remove generator
  artifacts, add `.env.example`, TypeScript, ESLint and Vitest gates.
- [x] **M1 — Domain and read API:** add Zod recipe contracts, timeline
  validation, MongoDB pool, `GET /api/recipes`, `GET /api/recipes/:id`,
  BrewMark proxy endpoints and admin create endpoint.
- [x] **M2 — Prototype correctness:** apply all search filters, implement a
  monotonic timer with pause/restart/completion vibration, and synchronize
  saved state across cards, detail and Guardados.
- [ ] **M3 — Server-rendered product routes:** move Buscar and recipe detail to
  Server Components, add `/recipes/[id]`, `/saved`, `/profile`, loading/error
  states, URL search params and cache invalidation.
- [ ] **M4 — Clerk and persistence:** replace fake auth with Clerk, protect
  Server Actions and admin mutations, persist likes/saves/preferences and add
  unique MongoDB indexes.
- [ ] **M5 — Production verification:** add Mongo integration tests, Playwright
  anonymous/authenticated flows, CI, seed/index scripts and coverage thresholds.

Each unchecked milestone is complete only when its tests, typecheck, lint and
build gates pass. Features explicitly listed as outside MVP scope below must
not be added while completing these milestones.

> **Document purpose:** Define the current MVP scope for a coffee recipe
> application inspired by the guided brewing experience of Aeromatic,
> generalized to multiple brewing methods.
>
> The product UI is **Spanish-only for the MVP**. Technical names,
> database fields, API routes, and implementation notes remain in
> English.

------------------------------------------------------------------------

# Context 1 --- Product & Design

## 1. Product concept

The application is a minimal coffee recipe book focused on **finding and
executing brewing recipes**.

The core experience is:

**Buscar receta → Abrir receta → Revisar características y preparación →
Ejecutar timeline**

The application should not behave like a traditional social network or a
complex coffee journal. The MVP is deliberately focused on recipes and
guided brewing.

Recipes are not created from the UI in the MVP. They are inserted and
managed through an API that will be defined separately.

------------------------------------------------------------------------

## 2. Design direction

### 2.1 Visual language

The application is designed **exclusively in dark mode**.

The desired visual direction combines:

-   Apple's **Liquid Glass / liquid-style visual language**
-   Duolingo-like UX principles
-   Minimal information density
-   Strong typographic hierarchy
-   Large, obvious interactive targets
-   Immediate visual feedback
-   Friendly rather than technical interaction
-   Rounded geometry
-   Layered/translucent surfaces used intentionally

The goal is **not** to reproduce either Apple or Duolingo literally.

Apple influences the visual treatment: - translucent floating
surfaces; - depth; - soft material separation; - fluid transitions; -
rounded containers; - dark-mode-first contrast.

Duolingo influences the UX: - obvious next actions; - very low cognitive
load; - large tap targets; - immediate state feedback; - short Spanish
copy; - interactions understandable without instructions.

### 2.2 Dark mode

There is no light theme in the MVP.

Use: - near-black primary background; - slightly elevated dark
surfaces; - translucent/glass floating elements where useful; -
high-contrast primary text; - subdued secondary metadata; - one
restrained accent color for selected/interactive states.

Glass effects must not reduce readability.

Content hierarchy is more important than decorative glass.

------------------------------------------------------------------------

## 3. Main navigation

A persistent bottom navigation bar contains three destinations:

**Guardados --- Buscar --- Perfil**

Each destination uses an icon, with a small Spanish label.

`Buscar` is the central item and the default landing screen.

Conceptually:

``` text
┌─────────────────────────────┐
│                             │
│          contenido           │
│                             │
│                             │
│   🔖          🔍         ◯   │
│ Guardados    Buscar     Perfil│
└─────────────────────────────┘
```

The navbar should feel like a floating liquid/glass surface rather than
a conventional solid toolbar.

------------------------------------------------------------------------

## 4. Buscar

`Buscar` is both the landing screen and recipe discovery surface.

There is no separate Home screen.

### Main elements

-   Page title: `Recetas`
-   Search field: `Buscar recetas...`
-   Filter controls
-   Recipe results

Initial filter dimensions:

-   Método
-   Café
-   Agua
-   Temperatura
-   Tiempo

Filters should favor compact chips and bottom sheets rather than large
forms.

Active filters must remain visible and easy to remove.

Example:

``` text
Recetas

[ 🔍 Buscar recetas... ]

[V60 ×] [250–350 ml ×] [Más]

...
```

------------------------------------------------------------------------

## 5. Recipe card

Recipe cards should be highly minimal.

The reference principle is a compact information card where typography
and alignment establish hierarchy instead of excessive decoration.

### Information hierarchy

**Primary copy** - Recipe name

**Secondary copy** - Brewing method - Author

**Tertiary metadata** - Coffee - Water - Temperature - Total time

**Actions / community** - Saved state - Like/community count

Example content:

``` text
Método 4:6
V60 · Tetsu Kasuya

20 g · 300 ml · 93 °C · 3:30

♡ 284                         🔖
```

Photography is **not required**.

The card should remain useful without imagery.

If method illustrations or images are introduced later, they should be
optional and must not become a required recipe field.

------------------------------------------------------------------------

## 6. Recipe view

Selecting a recipe opens one continuous vertical recipe view.

The user should not enter separate screens for recipe characteristics,
preparation, timer, or community.

The sections are:

1.  `Características`
2.  `Preparación`
3.  `Tiempo`
4.  `Comunidad`

The experience should feel like reading and then executing the same
document.

------------------------------------------------------------------------

## 7. Características

Display objective brewing parameters only.

No qualitative fields such as: - difficulty; - style; - tasting
description; - subjective rating.

Initial parameters:

-   Método
-   Café
-   Agua
-   Temperatura
-   Molienda
-   Tiempo

Example:

``` text
CARACTERÍSTICAS

Café
20 g

Agua
300 ml

Temperatura
93 °C

Molienda
18 clics
Timemore C3 >

Tiempo
3:30
```

`Ratio` may be displayed later, but should be calculated rather than
persisted:

``` text
ratio = water_ml / coffee_g
```

------------------------------------------------------------------------

## 8. Temperature

Recipes store temperature internally in Celsius.

The UI provides:

`°C | °F`

Changing the unit only changes presentation.

Example:

``` text
93 °C ⇄ 199 °F
```

The recipe data itself remains unchanged.

For the initial anonymous MVP, this can be local UI state.

When authenticated user preferences are introduced, the selected unit
may be persisted.

------------------------------------------------------------------------

## 9. Grind setting

The recipe stores a normalized/general grind target.

It does **not** store a Timemore-specific click count as its canonical
grind value.

The UI translates the target for the selected grinder.

Initial default grinder:

**Timemore C3**

Example:

``` text
Molienda

18 clics
Timemore C3 >
```

Tapping the grinder opens a searchable grinder selector.

Example:

``` text
Seleccionar molino

[ 🔍 Buscar molino... ]

Timemore
✓ C3
  C2
  C3 Pro

Baratza
  Encore
  Encore ESP

Comandante
  C40
```

For the first scope, Timemore C3 can simply be the default.

Once user sessions/preferences are implemented, the last/default grinder
should be associated with the user.

Handling missing grinder conversions is outside the initial scope.

------------------------------------------------------------------------

## 10. Preparación

Preparation contains instructions that the user should understand or
complete before/during brewing but which do not belong to the timer
model.

Example:

``` text
PREPARACIÓN

1. Enjuaga el filtro.
2. Añade 20 g de café.
3. Nivela la cama.
```

These instructions are stored separately from timed steps.

The copy should be concise and action-oriented.

------------------------------------------------------------------------

## 11. Tiempo

`Tiempo` exists **inside the recipe view**.

It is not a separate brewing screen or mode.

Before starting, the entire timeline is visible and can be inspected.

### Vertical timeline

The timeline is vertical.

Previous and upcoming steps remain visible to preserve context.

The current step receives a pleasant, large visual highlight rather than
replacing the entire interface.

Concept:

``` text
      00:00
      Verter hasta 60 ml
         │
         │
      00:45
      Esperar
         │
         │
   ●  01:10

      VERTER HASTA
      180 ml

         │
         │
      01:40
      Verter hasta 300 ml
```

The current instruction should be readable at a glance while brewing.

Avoid verbose copy.

Prefer:

`Verter hasta 180 ml`

over:

`Vierte lentamente agua hasta alcanzar una cantidad total de 180 ml.`

Whenever possible, water amounts in timed pouring instructions should
represent **cumulative targets**, because users typically follow the
value displayed on a scale.

------------------------------------------------------------------------

## 12. Timer controls

Timer controls appear as a floating liquid/glass element near the bottom
of the interface.

Primary controls:

-   Restart icon
-   Play / Pause icon

States:

``` text
↻   ▶
```

Before/rerunning.

``` text
↻   ⏸
```

While running.

``` text
↻   ▶
```

While paused.

The controls should be large enough for one-handed use while brewing.

Text labels are not necessary in the primary timer surface if the icons
are sufficiently clear and accessible.

------------------------------------------------------------------------

## 13. Timer behavior

The application determines the active step from elapsed time.

At every new timed step:

**short vibration**

At recipe completion:

**long vibration**

No sound is required in the MVP.

The recipe's completion time is automatically derived from its steps.

The timeline is visible at `00:00` before the user starts it.

### Explicitly outside initial scope

-   Keeping an active timer alive while navigating elsewhere in the app
-   Special background/lock-screen execution
-   Audio cues
-   Complex simultaneous timed actions
-   Grinder-conversion fallback behavior

------------------------------------------------------------------------

## 14. Comunidad

Community functionality is intentionally minimal.

A recipe can receive likes.

Community information appears:

-   on the recipe card;
-   at the bottom of the recipe under `Comunidad`.

Example:

``` text
COMUNIDAD

♡ 284 personas
```

The user can inspect who liked the recipe when user accounts support
this.

There are no: - comments; - reviews; - star ratings; - feeds; -
user-created recipe posts.

`Like` and `Guardar` are separate concepts.

**Like** = community interaction.

**Guardar** = personal recipe collection.

------------------------------------------------------------------------

## 15. Guardados

`Guardados` contains recipes saved by the current user.

It reuses the same recipe-card component used by `Buscar`.

No folders, collections, or tagging system are required for the MVP.

Authenticated persistence can be introduced with sessions.

------------------------------------------------------------------------

## 16. Perfil

The profile surface remains deliberately small.

Potential authenticated content:

``` text
Perfil

Molino
Timemore C3 >

Temperatura
[ °C | °F ]

Cuenta
...
```

Identity/account details are primarily owned by the authentication
provider.

------------------------------------------------------------------------

# Context 2 --- Data Schema

## 17. Database choice

Initial database:

**MongoDB Atlas**

The MVP should use the free tier.

The document model is appropriate because a recipe is naturally
retrieved as one unit and its preparation/timed steps belong exclusively
to that recipe.

A recipe should therefore be stored as **one MongoDB document**, with
embedded arrays.

Initial collections:

``` text
recipes
grinders
likes
saved_recipes
user_preferences
```

Not every collection must be implemented before authentication/community
functionality is enabled.

------------------------------------------------------------------------

## 18. Recipe document

Canonical conceptual shape:

``` json
{
  "_id": "...",
  "name": "Método 4:6",
  "author": "Tetsu Kasuya",
  "method": "v60",

  "coffee_g": 20,
  "water_ml": 300,
  "temperature_c": 93,

  "grind": {
    "target": "medium-coarse"
  },

  "preparation": [
    "Enjuaga el filtro",
    "Añade 20 g de café",
    "Nivela la cama"
  ],

  "steps": [
    {
      "instruction": "Verter hasta 60 ml",
      "start": 0,
      "end": 15
    },
    {
      "instruction": "Esperar",
      "start": 15,
      "end": 45
    },
    {
      "instruction": "Verter hasta 180 ml",
      "start": 45,
      "end": 75
    },
    {
      "instruction": "Verter hasta 300 ml",
      "start": 90,
      "end": 120
    }
  ],

  "created_at": "...",
  "updated_at": "..."
}
```

------------------------------------------------------------------------

## 19. Recipe fields

### `_id`

MongoDB document identifier.

### `name`

Human-readable recipe name.

The current product language is Spanish where the recipe title itself is
localized/owned by the application.

### `author`

Recipe author/creator attribution.

This does not imply that the author has an application account.

### `method`

Stable machine identifier for the brewing method.

Examples:

``` text
v60
aeropress
chemex
french-press
kalita
moka
clever
```

Do not use the Spanish display label as the canonical identifier.

The UI can map:

``` text
french-press → Prensa francesa
```

This avoids coupling persisted data to presentation language.

### `coffee_g`

Coffee dose in grams.

Numeric.

### `water_ml`

Water amount in milliliters.

Numeric.

### `temperature_c`

Canonical water temperature in Celsius.

Numeric.

Fahrenheit is calculated for display.

### `grind.target`

Normalized/general grind target.

The exact vocabulary/scale will be finalized alongside the grinder
conversion API.

The canonical recipe must not contain a grinder-specific setting as its
only grind representation.

### `preparation`

Ordered array of Spanish preparation instructions.

Order is represented by array position; an additional `order` property
is unnecessary for the initial schema.

### `steps`

Ordered array of timed recipe steps.

Each step contains:

``` json
{
  "instruction": "Verter hasta 180 ml",
  "start": 45,
  "end": 75
}
```

Times are expressed as **seconds from recipe start**.

`instruction` is Spanish user-facing copy.

`start` is required.

`end` may be optional when an instruction represents an instantaneous
transition or when its active period is naturally determined by the next
step.

------------------------------------------------------------------------

## 20. Step semantics

The application should not store an explicit `current_step`.

It derives it at runtime from elapsed time.

Conceptually:

``` text
elapsed >= step.start
AND
elapsed < step.end
```

When `end` is absent, the next step's `start` can determine when the
current step stops being highlighted.

Array order should correspond to chronological order.

Recipe ingestion should validate that `start` values do not move
backward.

------------------------------------------------------------------------

## 21. Total recipe time

Do **not** persist `total_time_seconds` in the initial schema.

It is derived from the timeline.

Conceptually:

``` text
totalTime = last meaningful step boundary
```

Usually this is:

``` text
max(step.end)
```

If the final step does not contain `end`, its `start` becomes the final
known boundary unless the ingestion/API contract later requires an
explicit completion boundary.

The API validation layer should eventually guarantee that every recipe
has an unambiguous completion time.

This prevents duplicated state such as:

``` text
steps imply 210 seconds
total_time_seconds = 240
```

------------------------------------------------------------------------

## 22. Derived values

Do not persist values that can be safely derived.

### Ratio

``` text
ratio = water_ml / coffee_g
```

Example:

``` text
300 / 20 = 15
→ 1:15
```

### Fahrenheit

``` text
°F = (°C × 9/5) + 32
```

### Total time

Derived from `steps`.

### Current timer step

Derived from elapsed time and `steps`.

------------------------------------------------------------------------

## 23. Grinder document

Initial shape:

``` json
{
  "_id": "...",
  "brand": "Timemore",
  "model": "C3",
  "slug": "timemore-c3",
  "external_id": "..."
}
```

`external_id` is reserved for mapping a grinder to the selected external
grinder/conversion API.

The exact conversion model is intentionally not defined yet.

------------------------------------------------------------------------

## 24. Authentication and users

Authentication provider:

**Clerk**

Database:

**MongoDB Atlas**

Clerk is responsible for identity concerns such as: - authentication; -
session management; - email/social identity; - account security.

MongoDB is responsible for application-specific user state.

Avoid duplicating Clerk identity data unless the application has a
concrete reason to persist it.

A minimal preferences document can eventually look like:

``` json
{
  "_id": "...",
  "clerk_user_id": "user_...",
  "temperature_unit": "C",
  "default_grinder_id": "..."
}
```

`clerk_user_id` is the stable link between Clerk identity and
application data.

------------------------------------------------------------------------

## 25. Likes

Likes should use a separate collection rather than embedding an
indefinitely growing user list inside recipe documents.

Example:

``` json
{
  "_id": "...",
  "clerk_user_id": "user_...",
  "recipe_id": "...",
  "created_at": "..."
}
```

Create a unique compound constraint/index conceptually equivalent to:

``` text
UNIQUE(clerk_user_id, recipe_id)
```

A user can like a recipe only once.

Recipe-card like counts can be calculated/aggregated or optimized later
if necessary.

Do not prematurely denormalize counts for the MVP.

------------------------------------------------------------------------

## 26. Saved recipes

Use a separate collection:

``` json
{
  "_id": "...",
  "clerk_user_id": "user_...",
  "recipe_id": "...",
  "created_at": "..."
}
```

Again:

``` text
UNIQUE(clerk_user_id, recipe_id)
```

Saved state and like state must remain independent.

------------------------------------------------------------------------

# Context 3 --- Decisions & Scope

## 27. Confirmed product decisions

### Product language

The MVP user interface is **Spanish**.

Technical schema/API terminology remains English.

### Theme

Dark mode only.

No light-mode implementation is required.

### Visual direction

Liquid/glass-inspired Apple aesthetic combined with Duolingo-like UX
simplicity and feedback.

### Landing screen

`Buscar` is the initial screen.

There is no separate Home.

### Main navigation

Exactly three primary destinations:

-   `Guardados`
-   `Buscar`
-   `Perfil`

### Recipe experience

A selected recipe is one continuous vertical page.

`Características`, `Preparación`, `Tiempo`, and `Comunidad` coexist on
that page.

### Recipe creation

There is **no recipe creation UI** in the MVP.

Recipes are created/managed through an API.

The administrative API contract is not yet finalized.

### Recipe storage

One MongoDB document per recipe.

Preparation and timed steps are embedded.

### Timed steps

Each timed step uses:

-   `instruction`
-   `start`
-   optional `end`

### Timer completion

The program determines recipe completion automatically from the recipe
timeline.

No redundant total-time field should initially be persisted.

### Timer feedback

Short vibration when a timed step starts.

Long vibration when the recipe completes.

No sound initially.

### Timer UI

Vertical timeline.

Current step receives a large visual highlight.

Floating restart and play/pause controls remain at the bottom.

### Temperature

Canonical storage: Celsius.

UI: `°C | °F` toggle.

### Grinder

Initial default: **Timemore C3**.

The grind value shown to the user is adapted to the selected grinder.

Grinder selection is searchable.

Persisting the user's grinder preference depends on
sessions/authentication.

### Community

MVP community functionality is limited to likes.

Like information appears on recipe cards and at the bottom of the
recipe.

No comments, ratings, or reviews.

### Saved recipes

Saving is separate from liking.

`Guardados` has its own main navigation destination.

### Database

MongoDB Atlas.

### Authentication

Clerk.

Identity/session concerns stay in Clerk; application-specific state
stays in MongoDB.

------------------------------------------------------------------------

## 28. Initial API surface

The exact recipe-management API is intentionally deferred until the data
model is stable.

The expected minimal public read surface is:

``` text
GET /recipes
GET /recipes/:id
```

The future protected management surface will likely require operations
equivalent to:

``` text
POST   /recipes
PUT    /recipes/:id
DELETE /recipes/:id
```

These routes are **directional, not yet a finalized API contract**.

Like and saved-recipe operations will be authenticated and defined
separately.

------------------------------------------------------------------------

## 29. Explicitly outside MVP scope

The following should not influence initial architecture beyond avoiding
obvious dead ends:

-   Recipe creation/editing UI
-   User-submitted recipes
-   Comments
-   Reviews
-   Star ratings
-   Social feed
-   Recipe difficulty
-   Recipe style labels
-   Tasting notes
-   Coffee journaling
-   Complex coffee inventory
-   Collections/folders for saved recipes
-   Timer persistence while navigating away
-   Lock-screen/background timer behavior
-   Audio timer cues
-   Complex simultaneous timer actions
-   Missing grinder conversion fallback
-   Advanced grinder calibration
-   Multiple user grinders/preferences before sessions
-   Light mode
-   Advanced analytics
-   Premature denormalization

------------------------------------------------------------------------

## 30. MVP product flow

The primary user flow is:

``` text
Buscar
  ↓
Filtrar / buscar receta
  ↓
Abrir receta
  ↓
Características
  ↓
Preparación
  ↓
Tiempo
  ↓
▶ Iniciar
  ↓
Timeline + vibraciones
  ↓
Vibración larga / receta completada
```

Secondary actions:

``` text
Receta → ♡ Like
Receta → 🔖 Guardar
Tarjeta → ♡ Like state/count
Tarjeta → 🔖 Guardar
Guardados → Abrir receta
Perfil → Preferencias de usuario
```

------------------------------------------------------------------------

## 31. Architecture principle

For the MVP, prefer **derived state over duplicated state**, **embedded
recipe-owned data over unnecessary collections**, and **external
identity management over custom authentication infrastructure**.

The product should remain small enough that the core value can be
validated:

> Can users quickly find a coffee recipe and comfortably follow it while
> brewing?

Everything that does not materially support that question should be
treated as a later-scope feature.
