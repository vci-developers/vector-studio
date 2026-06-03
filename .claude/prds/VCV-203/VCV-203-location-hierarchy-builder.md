# VCV-203 — Location Hierarchy Builder

## Problem Statement

When an admin sets up a hierarchical Program, there is no way to define that
Program's location structure from the app. The **Location Types** (the ordered
**Levels** such as District → SubCounty → Parish → Village) can only be created
by hand via raw API calls (Postman). Admins need to build and maintain a
Program's hierarchy — add levels, rename them, reorder them, and remove
unused ones — inside the survey-builder app, without corrupting Sites that
already exist.

## Solution

A **Location Hierarchy Builder** on a new `/locations` page, shown only for
hierarchical Programs. It lists the Program's Location Types in order (Level 1
at the top) and lets an authorized admin:

- add a new Level by name,
- rename a Level in place,
- reorder Levels,
- delete a Level that no Site uses.

The builder enforces safety guardrails on the frontend so a reorder or delete
can never invert or orphan existing Site trees, since the backend does not
guard these operations (see ADR 0001).

## User Stories

1. As a program admin, I want to open a dedicated Locations page, so that I can
   manage my Program's location structure in one place.
2. As a program admin, I want the Locations page to appear only for my
   hierarchical Program, so that the legacy Uganda Program (which uses the flat
   schema) is not shown an irrelevant builder.
3. As a program admin, I want to see all existing Location Types listed in Level
   order with Level 1 at the top, so that I understand my current hierarchy at a
   glance.
4. As a program admin, I want each Level's name and ordinal position shown, so
   that I can tell District from SubCounty without ambiguity.
5. As a program admin, I want to add a new Level by typing its name, so that I
   can extend my hierarchy (e.g. add "Household" below "Village").
6. As a program admin, I want a newly added Level to be placed at the bottom of
   the list automatically, so that I don't have to assign a Level number myself.
7. As a program admin, I want to rename a Level in place, so that I can fix
   wording (e.g. "Sub County" → "SubCounty") at any time.
8. As a program admin, I want a rename to propagate to the location hierarchy of
   every existing Site under that Level, so that names stay consistent across
   the Program.
9. As a program admin, I want to reorder Levels by moving them up or down, so
   that I can correct the structure during setup.
10. As a program admin, I want the builder to prevent me from reordering Levels
    that already have Sites, so that I cannot invert the parent/child meaning of
    an existing tree.
11. As a program admin, I want the builder to prevent me from inserting a new
    Level above any Level that already has Sites, so that occupied Levels keep
    their position.
12. As a program admin, I want to delete a Level that no Site uses, so that I can
    remove a mistake during setup.
13. As a program admin, I want the delete control disabled for any Level that has
    Sites, so that I understand up front that it cannot be removed.
14. As a program admin, I want a clear error if a delete is rejected because
    Sites reference the Level, so that I know why it was blocked.
15. As a program admin, I want my changes to persist and still be correct after a
    page reload, so that I can trust the builder.
16. As a program admin, I want all builder actions to require my authenticated,
    authorized session, so that unauthorized users cannot alter the hierarchy.
17. As a user without site-write permission, I want the builder's editing
    controls to be unavailable, so that I cannot make changes I'm not allowed to.
18. As a program admin, I want the order I see to be driven by stored Level
    values rather than incidental list position, so that the displayed order is
    reliable even if Levels were created out of order.
19. As a program admin, I want gaps in Level numbering (left behind by a delete)
    to be handled gracefully, so that the list still reads top-to-bottom
    correctly.
20. As a program admin, I want clear loading and error states while the builder
    fetches or saves data, so that I am never confused about the page's status.
21. As a program admin, I want a sensible empty state when the Program has no
    Levels yet, so that I know to start by adding Level 1.

## Implementation Decisions

**Domain & invariants** (per `.claude/CONTEXT.md` and ADR 0001)

- **Location Types / Levels are Program-global** — a single ordered list per
  Program. Every rename/reorder/delete affects all Site trees in the Program.
- `level` is an **explicit, server-stored, server-returned** integer treated as
  a **sort key, not a contiguous sequence**. The UI always sorts by `level`
  ascending and reasons about adjacency by sorted position, never `level - 1`.
  Deleting a Level leaves a gap; the backend does not renumber.
- On add, the new Level's value is computed as `max(level) + 1` and sent
  explicitly.
- **Rename** is safe (backend propagates the new name into every Site's location
  hierarchy). **Delete** is backend-blocked while any Site references the
  Location Type. **Reorder** is not backend-guarded and is made safe entirely on
  the frontend via the **frozen top-prefix** rule: occupied Levels `[1..k]` form
  a contiguous prefix and are frozen (no reorder, no insert-among, no delete);
  the empty tail `[k+1..n]` is freely editable.
- Occupancy `k` is derived from `canAccessSites`, which contains the full
  accessible subtree. Reorder authority is gated on user `privilege` as a proxy
  for full-program authority (explicit permission deferred — see ADR 0001).

**Gating**

- The builder is hidden for the legacy Uganda Program (program id 1) via the
  existing program-gate pattern, and lives within the already-admin-only home
  area. Editing controls additionally require the `writeSiteMetadata`
  permission.

**UI direction**

- The Levels editor is a clean **vertical reorderable list** (drag handle,
  inline rename, "+ Add level" pinned at the bottom), in the modern
  cloud-console register (the Linear-status / Airtable-field idiom). In-use
  Levels show a **lock glyph + tooltip** and disable delete/reorder, surfacing
  the frozen-prefix rule visually. It sits as a left rail / top strip beside the
  Site column view from VCV-208.
- Explicitly **not** an enterprise tree-outline (reads as DHIS2) and **not** a
  node-graph/flow-chart canvas.

**Modules to build**

- **Location Type resource module** — request/response Zod schemas (with derived
  types), server functions, and TanStack Query hooks: `useGetLocationTypes`,
  `usePostLocationType`, `usePutLocationType`, `useDeleteLocationType`. Mutations
  invalidate the Location Type query keys on success. Follows the existing
  per-resource convention (keys factory, `fetchXxx` query fn, composed
  `onSuccess` invalidation).
- **BFF routes** mirroring the backend 1-1, using the established `RouteParams` +
  `Number(...)` path coercion (no Zod on path params) and `Result<T, E>`
  responses:
  - collection route → `GET` (list), `POST` (create)
  - item route keyed by location type id → `PUT` (rename/reorder), `DELETE`
- **Level model builder (deep module)** — pure function mapping
  `(locationTypes, canAccessSites)` to an ordered list of Level rows annotated
  with occupancy and per-Level capability flags (`canReorder`, `canDelete`,
  `canInsertBelow`; rename always allowed). Encapsulates the frozen-prefix
  invariant, sort-by-`level`, and gap tolerance behind one interface.
- **Reorder planner (deep module)** — pure function mapping
  `(orderedLevels, fromPosition, toPosition)` to the minimal set of
  `{ id, level }` updates the client must `PUT`. The builder issues one `PUT` per
  changed row, then invalidates the Location Type keys.
- **Location Builder feature + `/locations` route** — a new feature module and
  page that derive `programId` from the session (no `programId` in the page
  URL), apply the Uganda + `writeSiteMetadata` gate, and compose the Level list
  with add/rename/reorder/delete controls, loading/error/empty states.

**API contracts**

- `GET` returns the Program's Location Types including `level`.
- `POST` body: `{ name, level }`.
- `PUT` body: `{ name?, level? }` for a single Location Type by id.
- `DELETE` by id; rejected by the backend when Sites reference the Level.

## Testing Decisions

- **No automated tests this round.** The repo currently has no test runner
  (only `typecheck`, `lint`, `format`). Confidence comes from `typecheck` + lint
  + manual verification, matching the repo's current state.
- The deep modules (Level model builder, reorder planner) are nonetheless built
  as **pure functions with no side effects**, so they can be unit-tested in
  isolation later without refactoring. Good tests would assert **external
  behavior only** — e.g. "given these Location Types and accessible Sites, Levels
  1..k are frozen and the tail is editable", "moving a tail Level produces this
  minimal set of level updates" — never internal structure.
- Style prior art for pure, isolated utilities: the form-builder utilities
  (`question-order`, `walk-questions`). When a runner is introduced, those are
  the modules to cover first.

## Out of Scope

- **Site creation** — covered by VCV-208 (depends on this PRD).
- **Site deletion, editing, and `isActive` management** — entirely out of scope.
  Because deleting a Level is blocked while Sites reference it, the "delete a
  Site node and propagate to children" problem does not arise here.
- **The legacy Uganda Program** — gated out of the builder; no migration of its
  flat sites to the hierarchical structure.
- **Backend changes** — none. Rename propagation, delete blocking, and `level`
  storage are existing backend behavior.
- **An airtight backend reorder guard** and an **explicit reorder permission** —
  deferred; see ADR 0001 for the residual partial-visibility risk accepted in
  v1.

## Further Notes

- **Assumptions to verify against the live backend** before/while building:
  the `GET` location-types response includes `level`; there is no backend
  uniqueness check on `level` (the client enforces the ordering invariant); a
  rename truly propagates into existing Sites' location hierarchy.
- Decision record: see `.claude/docs/adr/0001-location-type-reorder-safety.md`.
- Domain language and invariants: see `.claude/CONTEXT.md`.
