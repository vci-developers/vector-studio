# VCV-203 — Location Hierarchy Builder · Implementation Plan

Step-by-step plan for building the Location Hierarchy Builder described in
[VCV-203-location-hierarchy-builder.md](./VCV-203-location-hierarchy-builder.md).
Read that PRD, `.claude/CONTEXT.md`, and
`.claude/docs/adr/0001-location-type-reorder-safety.md` first — this document
assumes their domain language and invariants.

## Guiding conventions (verified against the codebase)

- **Data flow:** server function (`src/api/<resource>/…`) → BFF route
  (`src/app/api/…/route.ts`) → TanStack Query hook (`use…`). Client components
  never call the backend directly. Prior art: the `form` / `form-question`
  resource modules.
- **`programId` + `canAccessSites` come from one source:**
  `useGetUserPermissions()` returns
  `{ programId, permissions: { sites: { writeSiteMetadata, canAccessSites, … } } }`
  (see
  [user-permissions-schema.ts](../../../src/api/user/contracts/user-permissions-schema.ts)).
  No `programId` in the page URL — mirror `ProgramGate`
  ([program-gate.tsx](../../../src/features/form-builder/components/gate/program-gate.tsx)).
- **All responses wrapped in `Result<T, E>`; Zod-validate everything; derive
  types.** No try/catch in the UI layer.
- **BFF path params:** `RouteParams` interface with `params: Promise<…>` and
  `Number(...)` coercion, no Zod on path params. Prior art:
  [questions/[questionId]/route.ts](../../../src/app/api/programs/[programId]/forms/questions/[questionId]/route.ts).
- **Reorder UX:** **drag handle via `@dnd-kit`** (decided 2026-06-03). New
  dependency; the reorder planner is written generically (`from → to`) so the
  drag layer is the only place that knows about pointers.
- **Toasts:** `sonner` is already wired (`src/components/ui/sonner.tsx`); use it
  for save/error feedback as the form-builder does.
- **No automated tests this round** (no runner in repo). Deep modules are pure
  functions so they are unit-testable later. Confidence = `typecheck` + `lint` +
  manual verification.

## ⚠️ Verify against the live backend before/while building (PRD "Further Notes")

These gate the contracts. Confirm with a real call (Postman) early — they can
invalidate Phase 1–2 shapes:

1. The `GET` location-types response includes `level` (and the exact field
   names: `id`, `programId`, `name`, `level`).
2. Exact backend paths and methods for collection (`GET`/`POST`) and item
   (`PUT`/`DELETE`) — confirm they are nested under `/programs/{programId}/…`.
3. `POST`/`PUT` body field names (`{ name, level }` / `{ name?, level? }`).
4. A rename truly propagates into existing Sites' `locationHierarchy`.
5. `DELETE` is rejected (and with what status/shape) when Sites reference the
   Location Type — so the BFF/UI can surface the right error.

If any differ, adjust the Zod schemas in Phase 1 first; everything downstream
derives from them.

---

## Phase 1 — Location Type resource contracts (Zod schemas) ✅ Completed

New folder `src/api/location-type/contracts/`. One schema file per operation,
matching the `…Schema` suffix / derived-type / `…SuccessPayload` convention.

1. **`location-type-schema.ts`** — the shared resource shape:
   `{ id: number, programId: number, name: string, level: number }`. Export
   `locationTypeSchema` + `LocationType`.
2. **`get-location-types-schema.ts`** — response is the Program's Location Types
   (e.g. `{ locationTypes: z.array(locationTypeSchema) }` — match the real
   envelope). Export response type + `…SuccessPayload` alias.
3. **`post-location-type-schema.ts`** — request
   `{ name: z.string().min(1), level: z.number() }`; response wrapping the
   created `locationTypeSchema`.
4. **`put-location-type-schema.ts`** — request
   `{ name: z.string().min(1).optional(), level: z.number().optional() }`
   (rename and/or reorder); response wrapping the updated `locationTypeSchema`.
5. **`delete-location-type-schema.ts`** — response `{ message: z.string() }`
   (mirror `delete-question-from-draft-form-schema.ts`).

**Checkpoint:** `npm run typecheck`.

### What was implemented

Five contract files under `src/api/location-type/contracts/`:

- `location-type-schema.ts` — `locationTypeSchema` + `LocationType`
  (`{ id, programId, name, level }`).
- `get-location-types-by-program-id-schema.ts` — `{ locationTypes:
  z.array(locationTypeSchema) }` + response/SuccessPayload types.
- `post-location-type-to-program-schema.ts` — request `{ name: min(1), level }`,
  response `{ message, locationType }` + request/response/SuccessPayload types.
- `put-location-type-by-program-id-schema.ts` — `{ name: min(1), level }.partial()`
  request, `{ message, locationType }` response + types.
- `delete-location-type-from-program-schema.ts` — `{ message }` response + types.

`npm run typecheck` passes.

### Deviations from the plan

- **Verbose endpoint filenames** replace the shorthand listed in steps 2–5
  (`get-location-types-by-program-id-schema`, `post-location-type-to-program-schema`,
  `put-location-type-by-program-id-schema`, `delete-location-type-from-program-schema`).
  This applies the `feedback_form_schema_conventions` memory (verbose names
  matching the closest precedent) and supersedes the manifest names.
- **PUT request uses `.partial()`** on the `{ name, level }` base rather than the
  per-field `.optional()` written in step 4 — same resulting type, but honors the
  memory's "PUT schemas use `.partial()`" convention.
- **Resource id field is `id`** (matching `user-profile` / `annotation-task`
  precedent and the plan's step-1 shape), not the `locationTypeId` floated during
  drafting. Still pending the backend pre-flight check (field names).

### Outstanding

- ~~`npm run format` not yet run~~ — resolved in Phase 2: prettier now passes on
  all `src/api/location-type/**` files (contracts included).

## Phase 2 — Server functions + BFF routes ✅ Completed

### Server functions — `src/api/location-type/`

Mirror `put-draft-form-by-program-id.ts`: `safeApiCall<…>` with the response
schema, `Authorization: Bearer`, `safeParse` the request body (return
`err({ kind: 'client' })` on failure).

1. `get-location-types.ts` — `getLocationTypes(accessToken, programId)`
2. `post-location-type.ts` — `postLocationType(accessToken, programId, body)`
3. `put-location-type.ts` —
   `putLocationType(accessToken, programId, locationTypeId, body)`
4. `delete-location-type.ts` —
   `deleteLocationType(accessToken, programId, locationTypeId)`

Use the backend paths confirmed in the pre-flight check (expected:
`/programs/{programId}/location-types[/{locationTypeId}]`).

### BFF routes — `src/app/api/programs/[programId]/location-types/`

1. `route.ts` — `GET` (list) + `POST` (create). `GET` coerces `programId` via
   `Number(...)`; `POST` parses JSON body in try/catch →
   `err({ kind: 'client', status: 400 })` on bad JSON. Both wrap the server fn
   in `withAuthSession<…>` and return
   `NextResponse.json(result, { status: result.ok ? 200 : (result.error.status ?? 400) })`.
2. `[locationTypeId]/route.ts` — `PUT` (rename/reorder) + `DELETE`.
   `RouteParams` with `{ programId, locationTypeId }`, both
   `Number(...)`-coerced. Copy the structure of the existing
   `questions/[questionId]/route.ts` verbatim.

**Checkpoint:** `npm run typecheck && npm run lint`.

### What was implemented

Four server functions under `src/api/location-type/` and two BFF routes under
`src/app/api/programs/[programId]/location-types/`, each mirroring the closest
`form` / `form-question` precedent line-for-line.

Server functions (filename = contract filename minus `-schema`, name matches):

- `get-location-types-by-program-id.ts` —
  `getLocationTypesByProgramId(accessToken, programId)`. No-body `GET` to
  `/programs/${programId}/location-types`. Mirrors `getFormsByProgramId`.
- `post-location-type-to-program.ts` —
  `postLocationTypeToProgram(accessToken, programId, requestBody)`.
  `safeParse` → `err({ kind: 'client' })` guard, then `POST`. Mirrors
  `postQuestionToDraftForm`.
- `put-location-type-by-program-id.ts` —
  `putLocationTypeByProgramId(accessToken, programId, locationTypeId, requestBody)`.
  Same `safeParse` guard, then `PUT` to
  `/programs/${programId}/location-types/${locationTypeId}`. Mirrors
  `putQuestionToDraftForm`.
- `delete-location-type-from-program.ts` —
  `deleteLocationTypeFromProgram(accessToken, programId, locationTypeId)`.
  No-body `DELETE` by id. Mirrors `deleteQuestionFromDraftForm`.

BFF routes:

- `location-types/route.ts` — `GET` (list) + `POST` (create). `RouteParams` with
  `{ programId }`, `Number((await params).programId)` coercion; `POST` parses
  JSON in try/catch → `err({ kind: 'client', status: 400 })` on bad body. Both
  wrap the server fn in `withAuthSession<…>` and return
  `NextResponse.json(result, { status: result.ok ? 200 : (result.error.status ?? 400) })`.
  Mirrors `forms/route.ts` + `forms/questions/route.ts`.
- `location-types/[locationTypeId]/route.ts` — `PUT` (rename/reorder) +
  `DELETE`. `RouteParams` with `{ programId, locationTypeId }`, both
  `Number(...)`-coerced via the `routeParams` destructure. Mirrors
  `questions/[questionId]/route.ts` verbatim.

Variable naming follows the `authorized…Result` convention
(`authorizedGetLocationTypesByProgramIdResult`, etc.).

`npm run typecheck`, `npm run lint`, and `npx prettier --check` (server fns,
routes, **and** contracts) all pass.

### Deviations from the plan

- **Verbose server-function names** replace the manifest shorthand
  (`getLocationTypes` → `getLocationTypesByProgramId`, `postLocationType` →
  `postLocationTypeToProgram`, `putLocationType` → `putLocationTypeByProgramId`,
  `deleteLocationType` → `deleteLocationTypeFromProgram`). This carries the
  Phase 1 decision through so each server fn's name and filename mirror its
  contract 1:1 (exactly as `put-draft-form-by-program-id.ts` ↔
  `putDraftFormByProgramId`). Supersedes the manifest/§Phase 2 shorthand and the
  File manifest at the bottom of this document.

### Outstanding

- **Backend pre-flight not run** (PRD "Further Notes" / §⚠️). Per direction, the
  Phase 1 contracts are **trusted as-is**: paths
  `/programs/{programId}/location-types[/{locationTypeId}]`, response envelopes
  `{ locationTypes }` / `{ message, locationType }` / `{ message }`, and request
  bodies `{ name, level }` / `{ name?, level? }`. If a live call later
  contradicts these, fix the Phase 1 schemas first — everything downstream
  derives from them.

## Phase 3 — Query keys + TanStack Query hooks ✅ Completed

### `src/api/location-type/location-type-keys.ts`

Factory keyed by `programId` (mirror `form-keys.ts`):

```ts
export const locationTypeKeys = {
    root: ['location-types'] as const,
    byProgramId: (programId: number) => ['location-types', programId] as const,
};
```

### `src/api/location-type/hooks/`

1. `use-get-location-types.ts` — `useGetLocationTypes(programId)`.
   `fetchLocationTypes` `GET`s `/api/programs/${programId}/location-types` with
   `credentials: 'include'`, returns the parsed `Result`. Query key
   `locationTypeKeys.byProgramId(programId)`. Model on
   `use-get-user-permissions.ts`.
2. `use-post-location-type.ts` — `usePostLocationType()`. Variables
   `{ programId, requestBody }`. `onSuccess` (when `data.ok`) invalidates
   `locationTypeKeys.byProgramId(variables.programId)`.
3. `use-put-location-type.ts` — `usePutLocationType()`. Variables
   `{ programId, locationTypeId, requestBody }`. Same invalidation.
4. `use-delete-location-type.ts` — `useDeleteLocationType()`. Variables
   `{ programId, locationTypeId }`. Same invalidation.

Mutations invalidate on success; the builder also invalidates user permissions
only if occupancy could change (it cannot here — Levels don't change Sites), so
just invalidate the Location Type key. Model on
`use-put-draft-form-by-program-id.ts`.

**Checkpoint:** `npm run typecheck`.

### What was implemented

One keys factory and four hooks under `src/api/location-type/`, each mirroring
the closest `form` / `form-question` precedent line-for-line.

- `location-type-keys.ts` — `locationTypeKeys` with
  `root: ['location-types']` and
  `locationTypesByProgramId(programId) => ['location-types', programId]`.
  Mirrors `form-keys.ts`; the scoped method name mirrors the server function
  (`getLocationTypesByProgramId` → `locationTypesByProgramId`, exactly as
  `formsByProgramId`).
- `hooks/use-get-location-types-by-program-id.ts` —
  `useGetLocationTypesByProgramId(programId, options?)`. Extracted
  `fetchLocationTypesByProgramId` `GET`s `/api/programs/${programId}/location-types`
  with `credentials: 'include'`; query key
  `locationTypeKeys.locationTypesByProgramId(programId)`. Mirrors
  `useGetFormsByProgramId` (`…QueryResult` / `…QueryOptions` types, no schema
  re-validation).
- `hooks/use-post-location-type-to-program.ts` —
  `usePostLocationTypeToProgram()`. Variables `{ programId, requestBody }`;
  semantic-verb helper `createLocationTypeInProgram` (parallels
  `createQuestionInDraftForm`). `onSuccess` guarded by `data.ok`, invalidates
  `locationTypesByProgramId(variables.programId)`. Mirrors
  `usePostQuestionToDraftForm`.
- `hooks/use-put-location-type-by-program-id.ts` —
  `usePutLocationTypeByProgramId()`. Variables
  `{ programId, locationTypeId, requestBody }`; helper
  `updateLocationTypeInProgram` `PUT`s
  `/api/programs/${programId}/location-types/${locationTypeId}`. Same guarded
  invalidation. Mirrors `usePutQuestionToDraftForm`.
- `hooks/use-delete-location-type-from-program.ts` —
  `useDeleteLocationTypeFromProgram()`. Variables
  `{ programId, locationTypeId }`; helper `removeLocationTypeFromProgram`.
  Same guarded invalidation. Mirrors `useDeleteQuestionFromDraftForm`.

All four mutations invalidate **only** the Location Type key — never
user-permissions — since Levels don't change Site occupancy (per ADR 0001 / the
note above). Mutation hooks expose no `options` parameter; callers attach
toast/dialog behavior per-call via `mutate(vars, { onSuccess })`, matching the
established convention. Same-module imports are relative (`../location-type-keys`,
`../contracts/…`) exactly as `use-get-forms-by-program-id.ts` imports
`../form-keys`; `Result` / `NetworkError` stay absolute (`@/lib/…`).

`npm run typecheck`, `npm run lint`, and `npx prettier --check src/api/location-type/**`
all pass.

### Deviations from the plan

- **Verbose hook + key names** replace the manifest shorthand
  (`useGetLocationTypes` → `useGetLocationTypesByProgramId`, key `byProgramId` →
  `locationTypesByProgramId`, etc.). This carries the Phase 1–2 decision through
  so each hook's name, file, types, and key method mirror the server fn /
  contract 1:1. Supersedes the §Phase 3 shorthand and the File manifest at the
  bottom of this document.
- **PUT hook file renamed** from the initially-created
  `use-put-location-type-by-id.ts` to `use-put-location-type-by-program-id.ts`,
  so the filename is the exact kebab of its export (`usePutLocationTypeByProgramId`)
  and mirrors its sibling server fn / contract — matching the codebase rule that
  every hook file name equals its export name.

## Phase 4 — Deep modules (pure functions, unit-testable later)

New folder `src/features/location-builder/utils/`. **No React, no side
effects.** Mark the invariant code with `// see ADR 0001`.

### 4a. Level model builder — `level-model.ts`

`buildLevelModel(locationTypes: LocationType[], canAccessSites: Site[]): LevelRow[]`.

- Sort `locationTypes` by `level` ascending (never reason by `level - 1` — gaps
  are expected; `level` is a sort key).
- Compute occupancy `k`: the count of distinct Levels referenced by
  `canAccessSites` (via `locationTypeId`). By the contiguous-top-prefix
  invariant, occupied Levels are `[1..k]` in _sorted position_. Derive `k` as
  "number of leading sorted Levels that have at least one Site," tolerating gaps
  — i.e. walk the sorted list and count the contiguous occupied prefix.
- Return one `LevelRow` per Location Type:
  `{ id, name, level, ordinal /* 1-based sorted position */, isOccupied, canRename: true, canReorder: !isOccupied && actorCanEditLevels, canDelete: !isOccupied && actorCanEditLevels, canInsertBelow: !isOccupied && actorCanEditLevels }`.
    - **Rename always allowed** (safe — backend propagates).
    - Occupied (frozen-prefix) rows: no reorder, no delete, no insert-among.
    - The _editable tail_ `[k+1..n]` is freely editable.
- `actorCanEditLevels` is passed in (derived in the feature from
  `writeSiteMetadata` / privilege — ADR 0001 "authority by tier" proxy).

Export `LevelRow` type. Encapsulate sort + occupancy + capability flags behind
this one function so the UI never recomputes them.

### 4b. Reorder planner — `reorder-plan.ts`

`planReorder(orderedLevels: LevelRow[], fromPosition: number, toPosition: number): Array<{ id: number; level: number }>`.

- Operates on _sorted positions_, not raw `level` values.
- Returns the **minimal** set of `{ id, level }` updates the client must `PUT`:
  reassign the moved row and the rows it slid past to the `level` values of the
  positions they now occupy (i.e. the existing `level` values at the affected
  positions get reshuffled among the affected rows). Rows outside the
  `[min(from,to), max(from,to)]` window are untouched → not returned.
- Guard with `// see ADR 0001`: a move that would touch any occupied
  (frozen-prefix) position returns `[]` (no-op) — the UI must also prevent it,
  but the planner is the last line of defense.
- Generic `from → to` so the `@dnd-kit` layer is the only pointer-aware code;
  drag-end maps to `(fromIndex, toIndex)`.

### 4c. Next-level helper

`getNextLevel(orderedLevels: LevelRow[]): number` → `max(level) + 1` (or `1`
when empty). Mirrors `getNextQuestionOrder`. Used by add.

**Checkpoint:** `npm run typecheck && npm run lint`. (These are the modules a
future test runner should cover first — assert external behavior only.)

## Phase 5 — Feature UI: Location Builder

New feature `src/features/location-builder/`. Compose shadcn primitives (`card`,
`input`, `button`, `tooltip`, `dialog`, `skeleton`, `sonner`). Aesthetic: modern
cloud-console (Linear-status / Airtable-field idiom), **not** DHIS2
tree-outline, **not** node-graph (see `feedback_ui_aesthetic` + PRD).

### 5a. Add the DnD dependency

`npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`. Confirm it
builds clean. (Only new dependency in this work.)

### 5b. Gate + page-client

1. **`components/gate/location-program-gate.tsx`** — reuse the `ProgramGate`
   shape: hide for `UGANDA_PROGRAM_ID === 1`, render skeleton while pending,
   error banner on failure. Pass `programId`, `canAccessSites`, and
   `writeSiteMetadata` down to children (it already has the permissions payload
   — avoid a second fetch). Consider lifting the shared Uganda/error/skeleton
   bits rather than duplicating — but **do not promote to shared until a real
   second use exists**; for now a feature-local gate is fine.
2. **`components/location-builder-page-client.tsx`** — `'use client'`; renders
   the gate, passes derived props into `LocationBuilder`.

### 5c. The builder

3. **`components/builder/location-builder.tsx`** — orchestrator. Calls
   `useGetLocationTypes(programId)`; on success builds `levelModel` via
   `buildLevelModel(locationTypes, canAccessSites, actorCanEditLevels)`
   (memoized). Owns add/rename/reorder/delete handlers wiring the mutation
   hooks. Renders loading skeleton, error banner, empty state, or the list.
   `actorCanEditLevels = writeSiteMetadata` (v1 proxy per ADR 0001).
4. **`components/builder/level-list.tsx`** — the vertical reorderable list.
   `@dnd-kit` `DndContext` + `SortableContext` (vertical strategy). Renders
   `LevelRow`s top-to-bottom (Level 1 at top), with a `+ Add level` affordance
   pinned at the bottom. On drag-end: map to `(fromIndex, toIndex)`, call
   `planReorder`, then fire one `usePutLocationType` mutation per returned
   `{ id, level }`; toast on completion; invalidation refreshes the list.
   Frozen-prefix rows are not draggable and reject drops among them.
5. **`components/builder/level-row.tsx`** — single row: drag handle (disabled +
   hidden/greyed for occupied rows), inline rename `Input` (commit on blur/Enter
   → `usePutLocationType` with `{ name }`), ordinal + name display, delete
   button (disabled for occupied; opens confirm dialog otherwise). For occupied
   rows show a **lock glyph + `Tooltip`** explaining the frozen-prefix rule
   ("This level has sites and can't be moved or removed").
6. **`components/builder/add-level-row.tsx`** — pinned `+ Add level`; text input
   → `usePostLocationType({ name, level: getNextLevel(orderedLevels) })`. New
   Level lands at the bottom automatically.
7. **`components/builder/delete-level-dialog.tsx`** — confirm dialog (mirror
   `delete-question-dialog.tsx`). On a backend rejection (Sites reference the
   Level), surface a clear error toast/inline message (PRD story 14).

### 5d. States

8. **`components/loading/location-builder-skeleton.tsx`** — skeleton rows.
9. **`components/empty-state/no-levels-empty-state.tsx`** — "Start by adding
   Level 1" (PRD story 21).
10. **`components/error/…`** — reuse/parallel `FormBuilderErrorBanner` shape for
    load/save errors.

### 5e. Inline-rename safety

Renames are always allowed (even on occupied rows) — that's the one structural
edit that's safe on frozen Levels. Make sure the rename control is **not** gated
by `isOccupied`, only by `actorCanEditLevels`.

**Checkpoint:** `npm run typecheck && npm run lint && npm run format`.

## Phase 6 — Route + navigation

1. **`src/app/(home)/locations/page.tsx`** — server component rendering a page
   shell + `LocationBuilderPageClient` (mirror `forms/page.tsx`). The `(home)`
   layout already enforces auth + whitelist + `privilege === 3`; no extra server
   gating needed beyond the in-feature Uganda + `writeSiteMetadata` gate.
2. **Optional layout/shell** — if the PRD's "left rail / top strip beside the
   Site column view (VCV-208)" matters now, add a
   `components/layout/ location-builder-shell.tsx`. VCV-208 (Site creation) is
   out of scope here, so build the Levels editor standalone; leave layout room
   for the Site column to slot in later.
3. **Nav link** — add a `/locations` `Link` on `(home)/page.tsx` next to "Form
   Builder".

**Checkpoint:** `npm run typecheck && npm run lint`.

## Phase 7 — Manual verification (no automated tests)

Run the app (`npm run dev`) as a `privilege === 3`, whitelisted, non-Uganda user
and walk the PRD user stories:

- [ ] `/locations` loads; Levels listed in `level` order, Level 1 at top, with
      ordinal + name (stories 3, 4, 18).
- [ ] Uganda (program 1) user sees the gated empty state, not the builder (story
      2).
- [ ] Empty program shows the "add Level 1" empty state (story 21).
- [ ] Add a Level → lands at the bottom with `max(level)+1` (stories 5, 6).
- [ ] Rename a Level (including an occupied one) → persists; verify the name
      propagated into a Site's `locationHierarchy` (stories 7, 8).
- [ ] Drag-reorder a tail Level → minimal `PUT`s fire; order correct after
      reload (stories 9, 15).
- [ ] Occupied (frozen-prefix) Levels: drag handle disabled, can't drop among
      them, can't insert above them, lock glyph + tooltip shown (stories 10, 11,
      13).
- [ ] Delete an empty tail Level → removed; gap tolerated, list still reads
      top-to-bottom (stories 12, 19).
- [ ] Delete control disabled for occupied Levels; a backend-rejected delete
      surfaces a clear error (stories 13, 14).
- [ ] A user without `writeSiteMetadata` sees editing controls unavailable
      (stories 16, 17).
- [ ] Loading and error states render correctly (story 20).
- [ ] Reload after each change → state correct (story 15).

## File manifest (new)

```
src/api/location-type/
├── contracts/
│   ├── location-type-schema.ts
│   ├── get-location-types-schema.ts
│   ├── post-location-type-schema.ts
│   ├── put-location-type-schema.ts
│   └── delete-location-type-schema.ts
├── get-location-types.ts
├── post-location-type.ts
├── put-location-type.ts
├── delete-location-type.ts
├── location-type-keys.ts
└── hooks/
    ├── use-get-location-types.ts
    ├── use-post-location-type.ts
    ├── use-put-location-type.ts
    └── use-delete-location-type.ts

src/app/api/programs/[programId]/location-types/
├── route.ts                       # GET (list), POST (create)
└── [locationTypeId]/route.ts      # PUT (rename/reorder), DELETE

src/app/(home)/locations/page.tsx

src/features/location-builder/
├── utils/
│   ├── level-model.ts             # buildLevelModel  (deep module, // see ADR 0001)
│   ├── reorder-plan.ts            # planReorder      (deep module, // see ADR 0001)
│   └── level-model.ts            (getNextLevel lives here or alongside)
└── components/
    ├── location-builder-page-client.tsx
    ├── gate/location-program-gate.tsx
    ├── builder/location-builder.tsx
    ├── builder/level-list.tsx
    ├── builder/level-row.tsx
    ├── builder/add-level-row.tsx
    └── builder/delete-level-dialog.tsx
    ├── loading/location-builder-skeleton.tsx
    ├── empty-state/no-levels-empty-state.tsx
    └── error/location-builder-error-banner.tsx
```

Modified: `src/app/(home)/page.tsx` (nav link), `package.json` (`@dnd-kit/*`).

## Sequencing & dependencies

```
Pre-flight backend check ─▶ Phase 1 (contracts)
        │
        ▼
Phase 2 (server fns + BFF) ─▶ Phase 3 (keys + hooks)
        │
        ▼
Phase 4 (pure deep modules — parallelizable, no backend dep)
        │
        ▼
Phase 5 (feature UI) ─▶ Phase 6 (route + nav) ─▶ Phase 7 (manual verify)
```

Phase 4 has no dependency on Phases 1–3 except the `LocationType` / `Site`
types, so it can proceed in parallel once Phase 1 lands.
