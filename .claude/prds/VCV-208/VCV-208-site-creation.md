# VCV-208 — Site Creation (Hierarchical)

> Depends on **VCV-203 — Location Hierarchy Builder**. A Program must have
> Location Types defined before Sites can be created against them.

## Problem Statement

Admins cannot create **Sites** from the app. Sites (the concrete instances at
each Level — e.g. the District "Mayuge", the SubCounty "Malongo") can only be
created via raw API calls. For a hierarchical Program, admins need an in-app
flow to add a Site at a chosen Level, attach it to the correct parent, and have
its location hierarchy assembled correctly — while staying confined to the parts
of the tree they are allowed to manage.

## Solution

A **hierarchical Site-creation form**, co-located with the Location Hierarchy
Builder on the `/locations` page. The admin picks the Level the new Site belongs
to, names it, and — for any Level below Level 1 — selects a parent Site from the
immediately-higher Level within the trees they can access. The backend composes
the Site's location hierarchy from the parent's hierarchy plus the new
Level/name pair. Sites are created one at a time, top-down.

## User Stories

1. As a program admin, I want to create a new Site from the app, so that I no
   longer have to use raw API tooling.
2. As a program admin, I want the Site-creation form on the same page as the
   hierarchy builder, so that I can define Levels and then populate them without
   switching context.
3. As a program admin, I want to choose which Level a new Site belongs to, so
   that it is classified correctly (e.g. as a SubCounty).
4. As a program admin, I want to enter a name for the new Site, so that it is
   identifiable (e.g. "Malongo").
5. As a program admin creating a Site below Level 1, I want to select a parent
   Site, so that the new Site is attached to the correct branch of the tree.
6. As a program admin, I want the parent selector to offer only Sites at the
   immediately-higher Level, so that I cannot attach a Site to the wrong tier.
7. As a program admin, I want the parent selector to offer only Sites I can
   access, so that I can only build within trees I'm responsible for.
8. As a program admin with access to some but not all top-level Sites, I want to
   add children under the Sites I can access, so that I can extend my own
   branches.
9. As a program admin, I want creating a brand-new Level-1 root Site to be
   reserved for program-level authority, so that a confined user cannot mint new
   top-level trees and expand their own authority.
10. As a program admin, I want the new Site's location hierarchy to be assembled
    from its parent's hierarchy plus its own Level and name, so that filtering
    and reporting by hierarchy works immediately.
11. As a program admin, I want the new Site's Location Type and parent reference
    set automatically from my selections, so that I don't manage internal ids.
12. As a program admin, I want to create Sites one at a time at every Level, so
    that the flow is consistent and never confusing.
13. As a program admin, after creating a Site, I want it to become available as a
    selectable parent for deeper Sites, so that I can continue building down the
    tree in one sitting.
14. As a program admin, I want clear validation if I submit without a required
    name or parent, so that I can correct mistakes before saving.
15. As a program admin, I want a clear error if creation fails on the server, so
    that I know it did not persist.
16. As a program admin, I want all Site-creation actions to require my
    authenticated, authorized session, so that unauthorized users cannot create
    Sites.
17. As a user without site-write permission, I want the Site-creation form to be
    unavailable, so that I cannot create Sites I'm not allowed to.
18. As a program admin, I want a created Site to persist and still be correct
    after a page reload, so that I can trust the flow.
19. As a program admin on the legacy Uganda Program, I want not to see this form
    at all, so that I'm not offered a flow that doesn't apply.
20. As a program admin, I want the form to be unavailable until at least Level 1
    exists, so that I can't create Sites with no Level to classify them.
21. As an admin with access to more than one Site tree, I want each tree clearly
    distinguished, so that I always know which hierarchy I'm building in.
22. As an admin, I want a root Site shown with its full hierarchy context (not
    just its name), so that two Sites with the same name in different trees are
    never confused.
23. As an admin with access to a mid-level Site, I want its ancestor Levels shown
    as read-only context, so that I can see where my subtree sits without being
    able to edit Sites I don't own.
24. As an admin, I want the breadcrumb to always reflect the full path of the
    tree I'm in, so that I never lose track of my location across trees.

## Implementation Decisions

**Domain & rules** (per `.claude/CONTEXT.md`)

- Sites are created **one at a time, top-down** — a child's parent must already
  exist; there is no batch "parent + children" flow (kept consistent across all
  Levels to avoid a confusing mixed UX).
- **Access is to Sites, never to Levels.** Creating a **child** is authorized by
  access to its **parent** Site (subtree-scoped) and is open to any authorized
  site manager. Creating a **Level-1 root** has no parent to scope it, so it is
  reserved for program-level authority; in v1 (single privilege tier) it is open
  behind the existing privilege/`writeSiteMetadata` guard, written so it can
  later narrow to a program-admin tier.
- **The backend composes `locationHierarchy`** on create. The client never sends
  it.
- Only the **hierarchical** form is in scope. The legacy flat form is cut: its
  only Program (Uganda id 1) is gated out of the builder, so it would never
  render.

**UI direction**

- The Site hierarchy uses a **column view (Miller columns)** — side-by-side list
  panes drilled left-to-right, one column per Level — in the modern cloud-console
  register (Apple Finder / AWS Organizations / GCP Resource Manager). Explicitly
  **not** a tree-outline (reads as DHIS2) and **not** a node-graph/flow-chart
  canvas, both of which scale poorly for data entry.
- The pattern encodes the domain rules structurally: selecting a parent in one
  column reveals its children in the next (enforces "parent = immediately-higher
  Level"); columns only show Sites from `canAccessSites` (access scoping); "+ New
  {Level}" is a ghost button at each column's bottom expanding to an **inline
  input** (no modal) for fast top-down creation; root creation is the "+" on the
  first column (the program-admin-gated action).
- Polish details: sticky column headers with a **lock glyph** on frozen Levels, a
  **breadcrumb** above the canvas that doubles as the responsive collapse on
  narrow widths, per-column search, arrow-key navigation, per-column skeletons
  and empty states.

**Multi-tree disambiguation**

- A user may have access to more than one Site tree, and a granted root can sit
  at **any Level** (a grant is the granted node plus its subtree). The UI must
  always make clear **which tree a hierarchy belongs to**.
- The first column is **"your trees"** — the user's accessible roots (the
  topmost granted node of each subtree). Each root is labeled with its **full
  hierarchy context** sourced from `locationHierarchy` (e.g. `Mayuge › Malongo`),
  never its bare name, so identical names in different trees are never confused.
- The **breadcrumb is anchored to the selected root's full path**, including any
  ancestor Levels above an accessible mid-level root, shown as read-only/greyed
  context (the user cannot edit Sites they don't have access to).
- Disambiguation relies on `locationHierarchy` rather than on access to the
  ancestor Site objects, so a mid-level root still shows its full context for
  free.

**Modules to build**

- **Site creation resource** — extend the existing Site resource with a
  `POST` request schema and full-Site response schema (reusing the existing Site
  shape), a server function, a BFF route, and a `usePostSite` hook. On success
  the hook invalidates the user-permissions query so the newly created Site
  appears in `canAccessSites` and becomes a selectable parent.
- **BFF route** for Site creation, mirroring the backend create endpoint 1-1,
  with `Result<T, E>` responses and `programId` carried in the body.
- **Parent-options resolver (deep module)** — pure function mapping
  `(canAccessSites, orderedLevels, targetLevel)` to the eligible parent Sites
  (those at the immediately-higher occupied Level within the accessible subtree)
  plus whether the target Level is a root (no parent required). This is the only
  data source for the parent selector; no separate Site read endpoint is needed
  because `canAccessSites` contains the full accessible subtree.
- **Site-creation form** within the existing Location Builder feature on
  `/locations` — Level selector, name input, access-filtered parent selector
  (hidden/disabled for Level 1), validation, and loading/error states. Reuses
  the ordered-Level data from the hierarchy builder's Level model.

**API contract**

- `POST` body: `{ programId, locationTypeId, parentId?, name, isActive }` where
  `parentId` is omitted/null for a root and required otherwise, and `isActive`
  defaults to `true` (Site activation management is out of scope).
- Response: the created Site, including the backend-composed `locationHierarchy`.

## Testing Decisions

- **No automated tests this round** (no test runner in the repo; rely on
  `typecheck` + lint + manual verification).
- The **parent-options resolver** is built as a **pure function** so it can be
  unit-tested later without refactoring. Good tests would assert external
  behavior only — e.g. "for a target Level, only accessible Sites at the
  immediately-higher Level are offered as parents", "Level 1 is reported as a
  root needing no parent" — never internals.
- Style prior art for pure, isolated utilities: the form-builder utilities
  (`question-order`, `walk-questions`).

## Out of Scope

- **Location Type / Level CRUD** — covered by VCV-203 (prerequisite).
- **Editing, deleting, or deactivating existing Sites** (`isActive` management).
- **The legacy flat Site-creation form** and the legacy Uganda Program (gated
  out); no migration of legacy sites.
- **Backend changes** — none. Location hierarchy composition and access granting
  on create are existing backend behavior.

## Further Notes

- **Assumptions to verify against the live backend**: the create path and shape
  (`/sites/register` with `programId` in the body); that creating a Site grants
  the creator access so it appears in a refreshed `canAccessSites`; that
  `isActive` defaults sensibly when sent as `true`.
- Domain language and invariants: see `.claude/CONTEXT.md`.
