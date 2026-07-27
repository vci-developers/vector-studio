# VectorStudio Context

Domain language for VectorStudio — the web app used to configure programs, their
location hierarchies, sites, and survey forms for mosquito surveillance.

## Language

### Organization

**Program**: A top-level surveillance deployment (e.g. "Uganda Malaria"). Owns
its own location types, sites, users, and forms.

**Location Type**: A named _level_ in a program's location hierarchy — a row in
`location_types` (e.g. "District", "SubCounty", "Village"). Shared across the
whole program; ordered by `level`. _Avoid_: "level name" used loosely, "site
type".

**Level**: The ordinal position of a Location Type in the hierarchy (Level 1 =
top, e.g. District). _Avoid_: conflating with Location Type's database `id`.

**Site**: A concrete _instance_ at a Location Type — a row in `sites` (e.g.
"Mayuge" the District, "Malongo" the SubCounty). Self-referencing tree via
`parentId`; typed by `locationTypeId`. _Avoid_: "location", "node" used without
qualification.

**Location Hierarchy**: The JSON map cached on a Site (`locationHierarchy`)
recording the name at each ancestor level, e.g.
`{ "District": "Mayuge", "SubCounty": "Malongo" }`. **Legacy Sites carry an
empty object `{}` here**; a non-empty map signals a hierarchical Site.

**Legacy program**: A program using the old flat site schema (`district`,
`subCounty`, `parish`, `villageName`, `houseNumber`, `healthCenter`) with no
Location Types. Today these are the programs with **ids 1, 2, and 4** (Uganda
plus two others); all will be migrated later. Recognised **structurally, not by
a fixed id list**: a Legacy Site always carries an empty `locationHierarchy`
(`{}`), so a program whose accessible Sites are all empty-hierarchy is Legacy. A
small known-legacy-id set backstops the one blind spot — a Legacy user with no
accessible Sites. _Avoid_: "flat program" used inconsistently.

**Hierarchical program**: Any non-legacy program — uses Location Types + the
self-referencing Site tree. All programs other than id 1, and all new programs,
are hierarchical.

## Relationships

- A **Program** has many **Location Types**, ordered by **Level**.
- A **Program** has many **Sites** forming a tree via `parentId`.
- A **Site** is classified by exactly one **Location Type** (`locationTypeId`).
- A **Site** below Level 1 has exactly one parent **Site** at the immediately
  higher Level.
- A **Site**'s **Location Hierarchy** = its parent's Location Hierarchy +
  `{ [its Location Type name]: [its own name] }`, **composed by the backend** on
  create. The client `POST` body is only
  `{ programId, locationTypeId, parentId?, name, isActive }`.
- There is **no maximum hierarchy depth** — the number of Levels is unbounded
  (realistically ≤ ~10, but not guaranteed).

## Flagged ambiguities

- "delete a level" was used to mean both **deleting a Location Type** (the
  "SubCounty" level) and **deleting a Site node** (the SubCounty instance
  "Malongo"). Resolved: these are distinct operations. This work covers
  **Location Type** CRUD, plus **Site** _creation_, _rename_, and
  _activation/deactivation_. **Site deletion and reparenting remain out of
  scope.** Only the **hierarchical** Site builder is in scope; the legacy flat
  form is cut, since Legacy programs are gated out of the builder and the form
  would never render.
- "leaf" was used to mean both **a Site at the bottom Level** and **a Site with
  no children**, and activation was specified as leaf-driven. Resolved: neither
  reading drives activation — the bottom Level is the editable end of a global,
  mutable list, and childlessness flips as the tree grows. **Leaf** is now
  descriptive vocabulary only ("the deepest built Site — the real collection
  point"); every Site is toggleable and activation is cascaded, not derived (ADR
  0003). _Avoid_: treating "leaf" as a computed property.
- "program access code" was used for what is actually the standard authenticated
  session (the `accessToken` cookie → Bearer token via `withAuthSession`). There
  is no separate per-program secret code.
- "modify the levels within the tree I have access to" was used as if Location
  Types were subtree-scoped. Resolved: **Location Types / Levels are
  program-global** — one ordered list per Program. Any rename / reorder / insert
  / delete affects every Site tree in the program. The per-subtree,
  access-scoped freedom applies to **Site** creation/management only, never to
  Levels.

## Invariants

- **Occupied levels form a contiguous top-prefix.** Sites are created top-down
  (a Site needs a parent at the immediately higher Level), so if any Site exists
  at Level N, Sites exist at every Level above N. The "occupied" Levels are
  always `[1..k]`; the "editable tail" `[k+1..n]` has no Sites.
- **`level` is a sort key, not a contiguity guarantee.** Deleting a Location
  Type leaves a gap (backend does not renumber). Always sort Levels by `level`
  ascending and reason about adjacency by _sorted position_, never `level - 1`.
- **Rename is safe** — backend propagates the new name into every Site's
  `locationHierarchy`. **Reorder is NOT backend-guarded** — the frontend must
  prevent parent/child inversion. **Delete is backend-blocked** when any Site
  references the Location Type.
- The builder is gated on **program structure, not a fixed id**: Legacy programs
  (accessible Sites all carry an empty `locationHierarchy`; today Uganda +
  Kenya) are hidden; hierarchical programs see the builder. A small
  known-legacy-id set backstops the blind spot (a Legacy user with no accessible
  Sites). It lives inside the `(home)` area (`privilege === 3` + whitelisted).
  **Do not assume all builder users are full-program admins** — the privilege
  model is expected to fan out into tiers.
- **Two-tier authority (target model):** a **Location-type admin** tier may edit
  the global **Levels** (rename / reorder / insert / delete); a **Site manager**
  tier may only create/edit **Sites within `canAccessSites`** and never touches
  Levels. This keeps global-Level edits in the hands of program-wide admins
  while confining site managers to their accessible subtree. Today the gate is
  the `privilege` number (proxy); the intended replacement is explicit
  permissions.
- **Access is to Sites, never to Levels.** `canAccessSites` grants authority
  over specific Sites (and their subtrees); there is no "access to a Location
  Type". **`canAccessSites` contains the entire accessible subtree** (every
  granted Site plus all its descendants), so it is the sole data source for the
  builder and the parent selector — no separate Site GET is needed.
- **All Site modification is limited to Sites the user can access.** Creating a
  **child** is authorized by access to its **parent** Site (subtree-scoped) —
  open to any authorized site manager. Creating a **Level-1 root** has no parent
  to scope it, so it requires **program-level authority** — otherwise a user
  with 2 of 5 roots could mint a 6th and expand their own authority from
  nothing. In v1 (single privilege tier) root creation is open behind the
  existing privilege/`writeSiteMetadata` guard, written so it can later narrow
  to a program-admin tier.
- **Site activity is set per Site and cascaded (ADR 0003).** Every accessible
  Site carries its own `isActive` and is **directly toggleable**; nothing is
  derived. Activating a Site activates it and its whole **ancestor path**
  (up-cascade); deactivating a Site deactivates it and its whole **subtree**
  (down-cascade). The invariant is that the active set is **ancestor-closed** —
  an "active Site under an inactive ancestor" is **impossible by construction**.
  An active Site whose children are all inactive is **legal** and means
  collection is on at that Site only, which is what a half-built branch looks
  like. Reconciliation is applied at **save**: activation edits are staged as a
  draft (seeded from server state, so an untouched builder has zero pending
  changes), then committed as one confirmation → one `PUT` per changed Site,
  ordered deactivations-deepest-first then activations-shallowest-first so a
  partial commit still leaves an ancestor-closed tree — never per keystroke.
  (Create and rename, by contrast, are immediate point actions; **every Site is
  created inactive**, and creating a child never changes its parent's state.)
  The model runs **only over `canAccessSites`** and needs no Location Type data:
  the up-cascade stops at the topmost accessible node of a branch. Ancestors
  _above_ a grant are read-only context (only their names are known, via
  `locationHierarchy`, never their `isActive`); the partial-access case where an
  out-of-access ancestor is inactive is **deferred** — same residual-risk
  posture as ADR 0001, and inert today under the single `privilege === 3` tier.
- **Reorder uses the frozen-prefix occupancy computed over the actor's
  accessible Sites.** Residual risk: a Level empty in the actor's view but
  occupied in a tree they cannot see. Delete is backstopped by the backend
  block; the airtight fix for reorder (a program-wide per-Level Site count, or
  confirmed full visibility) is deferred — see ADR 0001.
