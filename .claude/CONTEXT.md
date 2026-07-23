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
Location Types. Today this is **only program id 1 (Uganda)**; it will be
migrated later. _Avoid_: "flat program" used inconsistently.

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
  **Location Type** CRUD and **Site** _creation_ only. **Site deletion / editing
  / deactivation is out of scope.** Only the **hierarchical** Site-creation form
  is in scope; the legacy flat form is cut, since its only program (Uganda id 1)
  is gated out of the builder and the form would never render.
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
- The hierarchy builder is gated on **program identity** (Uganda id 1 = legacy,
  hidden) and today lives inside the `(home)` area (`privilege === 3` +
  whitelisted). **Do not assume all builder users are full-program admins** —
  the privilege model is expected to fan out into tiers.
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
- **Reorder uses the frozen-prefix occupancy computed over the actor's
  accessible Sites.** Residual risk: a Level empty in the actor's view but
  occupied in a tree they cannot see. Delete is backstopped by the backend
  block; the airtight fix for reorder (a program-wide per-Level Site count, or
  confirmed full visibility) is deferred — see ADR 0001.

## Forms & Sessions

### Language

**Session**: A single field-collection event tied to one Site (e.g. one
household visit). The unit that carries Form Answers.

**Form Mode**: Which form system a Program uses — **exclusive per program, one
mode at a time**. **Surveillance Form** (legacy, e.g. Uganda) is a fixed-schema
form with a hardcoded field set. **Dynamic Form** is a versioned, admin-defined
question set built in the form builder. Mode is detected by the current-form
endpoint (`not_found` ⇒ Surveillance), **never by hardcoding country**. _Avoid_:
"custom form"; "legacy vs new" when precision matters.

The **form builder targets Dynamic Form programs**; the per-unit section rides
inside it and needs no gate of its own. Today **Uganda (id 1) is the sole
legacy/Surveillance program** (migration pending) and **every other and future
program is Dynamic**, so the Dynamic set is "all programs but Uganda" in
practice — but detection stays via the current-form endpoint, never a hardcoded
id.

**Session Unit**: A repeated collection sub-unit within a single Session (e.g. a
trap or room visited within one household visit). Carries no intrinsic semantic
identity fields — the mobile app guarantees distinct units within one Session.
**Session Units exist only under Dynamic Form programs** (Surveillance/legacy
programs have none). _Avoid_: sub-session, repeat, group.

**UI language: a Session Unit is surfaced to admins as a "collection".** Because
"unit" reads as jargon, all user-facing text calls it a **collection** (e.g.
"Per-collection questions", "answered again for each collection — each trap,
room, or HLC hour"). This is **presentation-only**: **code, schemas, query
params, and this glossary keep `Session Unit` / `unit` / `SESSION_UNIT` /
`isUnitIdentityComponent`**. Rule of thumb — `collection` appears **only inside a
user-facing string literal**; identifiers never use it. Every downstream step
follows the split: the screen says "collection", the code says "unit".

**"order" is overloaded — two distinct fields.** A Session Unit's
**`unitOrder`** is the _runtime_ sequence in which units were collected within
one Session (set by mobile, never touched by the builder). A Form Question's
**`order`** is the _authoring_ sequence of questions in the form definition.
They are unrelated; the builder configures the latter only. The field app
renders `SESSION` and `SESSION_UNIT` questions on **separate screens**, so their
`order` sequences never interleave at collection time.

**Form Answer Scope** (`answerScope` on a Form Question): either `SESSION` (one
answer per Session) or `SESSION_UNIT` (one answer per Session Unit). Set by the
admin when authoring a question in the form builder; the review layer later
resolves a `SESSION` answer's conflicts against `sessionIds`, a `SESSION_UNIT`
answer's against `sessionUnitIds`. _Avoid_: "question level/type" (collides with
the question's answer `type`).

**Unit Identity**: The set of a Session Unit's `SESSION_UNIT`-scoped questions
flagged `isUnitIdentityComponent: true`. Their combined answer values
**identify** the unit and are used to match the "same" unit across Sessions in a
Review Unit (group by the identity-value tuple). Shown as the unit's
**header/title**, never as resolvable conflict rows. Non-identity `SESSION_UNIT`
answers are the resolvable rows. _Avoid_: unit key, unit name.

### Invariants

- **A `SESSION` question is the default and backward-compatible.** Every
  existing question is `SESSION`-scoped; a new question defaults to `SESSION`.
- **Scope is immutable after creation.** A question's `answerScope` is fixed by
  the section it is created in and can never be edited; there is no cross-scope
  move. To "change" a question's scope, the admin deletes the tree and recreates
  it in the other section. This deliberately avoids the recursive cross-scope
  cascade (subtree re-scoping, identity clearing, prerequisite pruning) and its
  partial-failure risk. The scope selector therefore lives **only in the
  add-question flow** (implied by section); the edit sheet never shows it.
- **Identity components must be `required`.** Any question with
  `isUnitIdentityComponent: true` must have `required: true` — an identity field
  that could be left blank cannot identify a unit.
- **`isUnitIdentityComponent` is only meaningful on `SESSION_UNIT` questions.**
  A `SESSION` question is never an identity component.
- **Identity is toggled only on a root question** (`parentId === null`) and
  **inherits down the whole subtree** — parallel to scope. A follow-up never
  carries its own identity toggle; it is an identity component **iff its root
  is**. So there are no "identity islands": a non-identity root's subtree is
  entirely non-identity, an identity root's subtree is entirely identity. This
  inheritance is what makes **branch-specific composite identity** possible: an
  identity root with options A/B whose A-branch follow-ups are C, D and whose
  B-branch follow-up is E yields units keyed **AC / AD / BE**, not just **A /
  B**. Without it, two distinct units (AC and AD) collapse to the same key "A"
  and — since there is one form per unit — one is lost.
- **An identity root may not have a visibility rule (narrow rule).** In this
  builder, nesting (`parentId`) and visibility (`prerequisite`) are
  **independent axes** — "root" means `parentId === null`, _not_ "always shown";
  a root question _can_ be given a visibility rule. If an identity root were
  conditional, units failing its rule would get an empty, ungroupable identity.
  So marking a question as identity **bars a visibility rule on it** (the
  builder disables/clears the prerequisite editor). Only identity roots are
  constrained this way; **non-identity roots keep the freedom to be
  conditional** (unchanged from VCV-209). Branches _below_ the identity root
  branch freely and remain conditional — that is the AC/AD/BE machinery.
- **Required bites only when visible.** An identity component is `required`, but
  a branch follow-up (e.g. C, shown only when the parent = A) is enforced only
  for units that took that branch. A unit's **identity tuple** is the set of
  identity answers it actually has, so it varies by branch; two units are "the
  same" iff their tuples match.
- **A form that has any `SESSION_UNIT` question must have ≥1 identity
  component.** The degenerate case — a single `SESSION_UNIT` question — is
  itself the identity component. As unit questions are added, the admin chooses
  which identity subtree(s) form the identity; the review layer keys on the
  resulting tuple.
- **Prerequisites never cross scope.** A question's visibility rule may only
  reference questions of the **same** `answerScope` — `SESSION` references
  `SESSION`, `SESSION_UNIT` references `SESSION_UNIT`. The asymmetric relaxation
  (letting a `SESSION_UNIT` question depend on a `SESSION` answer, which is
  well-defined since a session answer is shared by every unit) is **deliberately
  deferred** until a real form needs it; a `SESSION` question depending on a
  `SESSION_UNIT` answer stays permanently forbidden (ill-defined — "which unit's
  answer?").
