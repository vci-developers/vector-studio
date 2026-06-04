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
- **No automated tests this round** (no runner in repo). Any pure helper we
  extract later is unit-testable in isolation. Confidence = `typecheck` +
  `lint` + manual verification.

### Implementation rules (apply to every remaining phase)

- **Build incrementally, inside-out.** Write component logic inline first. Do
  **not** pre-create utility modules or a standalone "deep modules" layer. Reach
  for `src/features/location-builder/utils/` only once a piece of logic is
  actually reused (≥ 2 call sites) or hides genuinely non-trivial logic — and add
  it then, not before.
- **Minimal, true utilities only.** An extracted utility is a **pure** function:
  no React/JSX, no component state, no side effects, no UI-shaped output
  (capability flags, view-model rows). If it leans on a component concern it
  stays in the component. Prefer fewer utilities; inline thin wrappers.
- **No intermediate type interfaces unless absolutely needed.** Reuse the
  existing contract types (`LocationType`, `Site`) and inline return shapes
  (`Array<{ id; level }>`, mirroring `swapAdjacentSiblings`) instead of
  manufacturing row / view-model types.
- **Descriptive, role-encoding variable names.** Names say what the value is and
  stores — `occupiedLevelCount`, `levelSortedLocationTypes`, `levelUpdates`,
  `movedLocationType`. Keep the specific long name; do not shorten to the
  "shortest unambiguous" form.
- **Follow existing patterns first.** Mirror the form-builder precedent
  (`question-order.ts`, `walk-questions.ts`, the gate / list / row component
  split) before introducing any new variation.

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

## Phase 4 — Domain logic the builder needs (implement inline; extract on demand) ✅ Completed

**No upfront utility modules.** This phase is the logic to get right, not a list
of files to create. Build it inline (memoized) inside the Phase 5 components.
Promote a piece into `src/features/location-builder/utils/` **only when it earns
its keep** — reused at ≥ 2 call sites, or hiding genuinely non-trivial logic —
and only as a **pure** function (no React, no component state, no UI-shaped
output, no manufactured intermediate types). Work directly off the existing
`LocationType` / `Site` contract types. Mark any invariant code with
`// see ADR 0001`.

### 4a. Sort + occupancy (frozen prefix) — see ADR 0001

- Always sort the Program's Location Types by `level` ascending; never reason by
  `level - 1` (gaps are expected — `level` is a sort key). The 1-based ordinal
  shown in the UI is just the sorted index `+ 1` — no helper.
- Occupancy `k`: from `canAccessSites`, collect the set of referenced
  `locationTypeId`s, then walk the level-sorted list and count the contiguous
  occupied **prefix** (stop at the first Level with no Site, tolerating gaps). By
  the contiguous-top-prefix invariant the occupied Levels are `[1..k]`; the
  editable tail is `[k+1..n]`.
- A Level is frozen (no reorder, no delete, no insert-among) when its sorted
  index `< k`. **Rename is always allowed** (safe — backend propagates). Editing
  controls additionally require `writeSiteMetadata` (the v1 `actorCanEditLevels`
  proxy — ADR 0001 "authority by tier").
- This occupied-prefix count is the one genuinely non-trivial value and is read
  by both rendering (lock glyphs / disabled controls) and reorder planning — so
  it is the **first candidate** for extraction, to a pure
  `countOccupiedLevels(levelSortedLocationTypes, canAccessSites): number`, _if_
  the inline version ends up duplicated.

### 4b. Reorder planning — see ADR 0001

- On drag-end, map the drag to `(fromIndex, toIndex)` over the sorted list and
  compute the **minimal** set of `{ id, level }` updates to `PUT`: each row in
  the affected window `[min, max]` inherits the `level` value of the position it
  now occupies; unchanged rows (everything outside the window) are omitted.
  Mirror the bare `{ id, order }[]` return of `swapAdjacentSiblings` — **no**
  intermediate type.
- **Guard (last line of defense):** a move whose window reaches into the frozen
  prefix `[0..k-1]` is a no-op (`[]`). The UI must also prevent it, but this
  backstops it.
- Keep it generic (`from → to`) so the `@dnd-kit` layer is the only
  pointer-aware code. Extract a pure `planReorder(...)` only if the drag-end
  handler grows non-trivial.

### 4c. Next level on add

- New Level's value = `max(level) + 1` (or `1` when empty), sent explicitly.
  Trivial — inline it at the add call. Extract a `getNextLevel(locationTypes)`
  (mirroring `getNextQuestionOrder`) only if it ends up reused.

**Checkpoint:** none on its own — this logic is verified as part of Phase 5.

### What was implemented

All three pieces live **inline** in the Phase 5 components — **no `utils/` folder,
zero feature utilities**. Each derivation has a single call site, so none met the
"reused ≥ 2 sites" bar; the plan's extraction candidates (`countOccupiedLevels`,
`planReorder`, `getNextLevel`) were all kept inline.

- **Sort** — `locationTypesSortedByLevel` (`useMemo`) in `location-builder.tsx`.
- **Occupancy** — computed in `location-builder.tsx` as a **boundary index**,
  `firstLevelWithNoSitesIndex` (length of the contiguous occupied prefix), passed
  down once. The per-row flag is `hasSites = index < firstLevelWithNoSitesIndex`.
  See Phase 5 Deviation 5 for the naming rationale (boundary index, not a count).
- **Reorder planning** — inline in `LocationLevelList.handleReorder`; the minimal
  set is a bare `Array<{ id; level }>` (`updatedLocationLevels`), no intermediate
  type, mirroring `swapAdjacentSiblings`.
- **Next level** — inline in `AddLocationLevelForm` (`max(level) + 1`, else `1`).

## Phase 5 — Feature UI: Location Builder ✅ Completed

New feature `src/features/location-builder/`. Compose shadcn primitives (`card`,
`input`, `button`, `tooltip`, `dialog`, `skeleton`, `sonner`). Aesthetic: modern
cloud-console (Linear-status / Airtable-field idiom), **not** DHIS2
tree-outline, **not** node-graph (see `feedback_ui_aesthetic` + PRD).

Build the components **inside-out with the Phase 4 logic inline** (sort,
occupied-prefix count, reorder updates, next level), memoized in the orchestrator
and handlers. Extract a pure utility under `utils/` **only** once the same logic
is duplicated or grows non-trivial — see the Implementation rules above.

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
   `useGetLocationTypesByProgramId(programId)`; on success sorts the Location
   Types by `level` and computes the occupied-prefix count **inline** (memoized;
   Phase 4a) — no pre-built model or row type. Owns add/rename/reorder/delete
   handlers wiring the mutation hooks. Renders loading skeleton, error banner,
   empty state, or the list. `actorCanEditLevels = writeSiteMetadata` (v1 proxy
   per ADR 0001).
4. **`components/builder/level-list.tsx`** — the vertical reorderable list.
   `@dnd-kit` `DndContext` + `SortableContext` (vertical strategy). Renders the
   level-sorted Location Types top-to-bottom (Level 1 at top), with a
   `+ Add level` affordance pinned at the bottom. On drag-end: map to
   `(fromIndex, toIndex)`, compute the minimal `{ id, level }` updates inline
   (Phase 4b), then fire one `usePutLocationTypeByProgramId` mutation per update;
   toast on completion; invalidation refreshes the list. Frozen-prefix rows are
   not draggable and reject drops among them.
5. **`components/builder/level-row.tsx`** — single row: drag handle (disabled +
   hidden/greyed for occupied rows), inline rename `Input` (commit on blur/Enter
   → `usePutLocationTypeByProgramId` with `{ name }`), ordinal + name display,
   delete button (disabled for occupied; opens confirm dialog otherwise). For
   occupied rows show a **lock glyph + `Tooltip`** explaining the frozen-prefix
   rule ("This level has sites and can't be moved or removed").
6. **`components/builder/add-level-row.tsx`** — pinned `+ Add level`; text input
   → `usePostLocationTypeToProgram` with `{ name, level }`, where `level` is
   `max(level) + 1` computed inline (Phase 4c). New Level lands at the bottom
   automatically.
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

### What was implemented

Actual structure (supersedes the File manifest at the bottom of this doc):

```
src/features/location-builder/
├── validation/
│   └── add-location-level-form-schema.ts
└── components/
    ├── location-builder-page-client.tsx
    ├── builder/
    │   ├── location-builder.tsx               # orchestrator
    │   ├── location-level-list.tsx            # @dnd-kit list + reorder
    │   ├── location-level-row.tsx             # drag/lock, inline rename, delete
    │   ├── add-location-level-form.tsx        # RHF + zod create form
    │   └── delete-location-level-dialog.tsx
    ├── loading/location-builder-skeleton.tsx
    └── empty-state/
        ├── no-levels-empty-state.tsx
        └── uganda-program-empty-state.tsx
```

Shared, promoted this step (see Deviation 1):

```
src/components/gate/program-gate.tsx           # generic, slot-based
src/components/error/error-banner.tsx          # generic, on shadcn Alert
src/components/ui/alert.tsx                     # npx shadcn add alert
```

Deleted: `src/features/form-builder/components/gate/program-gate.tsx`,
`…/components/error/form-builder-error-banner.tsx`. Form-builder's 3 page-clients
and 5 error-banner consumers were migrated to the shared components.

`npm run typecheck`, `npm run lint`, and `npm run format` all pass.

### Deviations from the plan

1. **Gate + error banner promoted to shared root, not feature-local.** Plan 5b/5d
   said keep a feature-local gate/banner "until a real second use exists." That
   second use (location-builder) arrived in the same step, so both were promoted:
   `src/components/gate/program-gate.tsx` (generic — `skeleton` + `ugandaFallback`
   slot + `children(programId, permissions)`) and
   `src/components/error/error-banner.tsx` (generic `ErrorBanner`). The planned
   `gate/location-program-gate.tsx` and `error/location-builder-error-banner.tsx`
   were **not** created.
2. **`ErrorBanner` is built on the shadcn `Alert` primitive** (`ui/alert.tsx`,
   added via `npx shadcn add alert`), not a hand-rolled div — "use shadcn
   primitives as much as possible."
3. **Edit-authority flag dropped.** Plan 4a/5c/5e gated editing on
   `writeSiteMetadata` (`actorCanEditLevels`). The `(home)` layout already
   redirects anyone with `privilege !== 3`, and ADR 0001 names **privilege** as
   the v1 authority tier — so `writeSiteMetadata` was itself a drift from the ADR.
   Removed it: the **frozen prefix (`hasSites`) is the only structural gate**, and
   PRD stories 16–17 collapse into the upstream privilege gate. Per-actor
   permission stays deferred (ADR 0001); re-adding it later is a one-prop change.
4. **Permissions reach the builder as a single `accessibleSites` prop.** The gate
   yields `(programId, permissions)`; the page-client passes only
   `permissions.sites.canAccessSites` → `LocationBuilder.accessibleSites`. No
   `writeSiteMetadata` threading, no second `useGetUserPermissions` in the builder.
5. **Occupancy is a boundary index, not a count.** Implemented as
   `firstLevelWithNoSitesIndex` (the index where the editable tail begins) rather
   than the plan's `countOccupiedLevels`. Same number, but it reads without jargon
   at the call sites (`hasSites={index < firstLevelWithNoSitesIndex}`); the per-row
   flag is `hasSites`, the 1-based display number is `displayPosition`. Inline,
   single call site — no util.
6. **The add control is a form, not a row.** `add-level-row.tsx` →
   `add-location-level-form.tsx` (`AddLocationLevelForm`), built with
   react-hook-form + `zodResolver` + shadcn `Field`/`FieldError`, backed by a new
   `validation/add-location-level-form-schema.ts`. Matches the `login-form` /
   `question-form` precedent.
7. **Component names carry the `LocationLevel*` prefix** (`LocationLevelList`,
   `LocationLevelRow`, `AddLocationLevelForm`, `DeleteLocationLevelDialog`),
   superseding the plan's `LevelList` / `LevelRow` / `delete-level-dialog` names.
8. **Reorder uses sequential `mutateAsync` + a manual `isReordering` batch flag**
   (re-entry guard + dim/lock the list while the N PUTs run). Single-shot
   mutations (rename / add / delete) use the hook's own `isPending`.
9. **A feature-local `uganda-program-empty-state.tsx` was added** (location
   wording) and passed into the shared gate's `ugandaFallback` slot — not in the
   manifest, but required once the gate became wording-agnostic.

### New conventions (carry forward)

- **Shared gate/error live at the root once ≥ 2 features need them.** `ProgramGate`
  = `(programId, permissions) ⇒ ReactNode` with `skeleton` + `ugandaFallback`
  slots; `ErrorBanner` is generic and built on shadcn `Alert`.
- **`(home)` admin edit-authority = the layout's `privilege === 3` gate** (ADR 0001
  tier), not a per-feature `writeSiteMetadata` check, until an explicit permission
  exists.
- **Pending state:** one mutation → the hook's `isPending`; a batched op (N
  sequential `mutateAsync`) → a local `is…ing` flag set before the loop, cleared in
  `finally`, driving both the re-entry guard and the UI disable.
- **Forms = react-hook-form + `zodResolver` + shadcn `Field`/`FieldError`**, with a
  `<feature>/validation/<name>-form-schema.ts` (UI schema separate from the wire
  contract). Inline single-field commit-on-blur edits (rename) stay a plain
  `Input`, not a form.
- **Name by the data fact / boundary, not the derived concept:**
  `firstLevelWithNoSitesIndex`, `hasSites`, `displayPosition` — never
  `occupiedLevelCount` / `isFrozen` / `ordinal`.
- **Don't prop-drill server state as cherry-picked scalars** — pass the one
  cohesive value a consumer needs (`accessibleSites`), or read the cached query in
  the consumer.

## Phase 6 — Route + navigation  ✅ Completed

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

### What was implemented

Three files, each mirroring the `forms` precedent 1:1. No utils, no new types —
pure wiring.

- **`src/app/(home)/locations/page.tsx`** — `LocationsPage`, a thin server
  component (no `'use client'`) that renders `LocationBuilderPageShell` wrapping
  `LocationBuilderPageClient`. Mirrors `forms/page.tsx` line-for-line. No extra
  gating: the `(home)` layout already enforces auth + whitelist + `privilege ===
  3`, and the Uganda gate lives inside the page-client's `ProgramGate`.
- **`src/features/location-builder/components/layout/location-builder-page-shell.tsx`**
  — `LocationBuilderPageShell`, a single-`children` shell mirroring
  `FormVersionsPageShell` (same `mx-auto w-full max-w-5xl space-y-8 py-8`
  container + header). Title "Location hierarchy", description "Define and order
  the location levels your Program's sites are organized into." (`&apos;`-escaped).
  `LocationBuilder` renders no header of its own, so the shell owns it.
- **`src/app/(home)/page.tsx`** — added `<Link href="/locations">Location
  Builder</Link>` next to the existing Form Builder link.

`npm run typecheck` and `npm run lint` both pass.

### Deviations from the plan

- **Shell named `LocationBuilderPageShell`** (file `location-builder-page-shell.tsx`),
  not the plan's tentative `location-builder-shell` — matches the `…PageShell`
  suffix of the `FormVersionsPageShell` precedent. Built standalone (no left
  rail / Site column); VCV-208 is out of scope, so layout room is left for it
  rather than scaffolded now.
- **Nav link ordered before Form Builder** on the home page (cosmetic; the home
  nav is still unstyled, links rendered bare in a `Fragment` as before).

## Phase 7 — Manual verification (no automated tests)  ⛔ Not started (Phase 6 done — ready to run)

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
├── utils/                         # created ON DEMAND only (Phase 4): pure fns
│                                  #   extracted when reused / non-trivial, e.g.
│                                  #   countOccupiedLevels, planReorder, getNextLevel
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
Phase 4 (domain logic — implemented inline inside Phase 5)
        │
        ▼
Phase 5 (feature UI, inside-out) ─▶ Phase 6 (route + nav) ─▶ Phase 7 (verify)
```

Phase 4 is no longer a standalone module-building step: its logic is written
inline as Phase 5 is built, and any pure utility is extracted only once it earns
its keep (reused or non-trivial). It depends only on the `LocationType` / `Site`
contract types from Phase 1.
