# Location Type reorder safety is enforced client-side

## Status

accepted

## Applies to

The Location Hierarchy Builder — specifically the Location Type reorder/delete
logic and the level-model occupancy guard (the "frozen top-prefix" rule). Look
for `// see ADR 0001` at the reorder planner and the reorder/delete gating in
the level model builder.

## Context & Decision

Location Types (hierarchy Levels) are **program-global** and ordered by an
integer `level`. Renaming a Level is safe (the backend propagates the new name
into every Site's `locationHierarchy`), and deleting a Level is safe (the
backend blocks deletion while any Site references it). **Reordering is the one
dangerous operation:** the backend does not validate it, so swapping Levels can
invert the parent/child meaning of Sites already in the tree, and there is no
backend work in scope to guard it.

We therefore enforce reorder safety entirely on the frontend, on two pillars:

1. **Frozen top-prefix.** Because Sites are created top-down, occupied Levels
   always form a contiguous prefix `[1..k]`. The builder freezes those Levels
   (no reorder, no insert-among, no delete) and only allows structural edits in
   the empty tail `[k+1..n]`. Occupancy is derived from `canAccessSites`.
2. **Authority by tier.** Editing global Levels is reserved for a Location-type
   admin; Site managers may only touch Sites within their accessible subtree and
   never reorder Levels. Today this is gated on the user `privilege` number
   (every `(home)` user is `privilege === 3`); the intended replacement is an
   explicit permission.

## Considered alternatives

- **Backend-validated reorder** (or a program-wide per-Level Site count exposed
  to the client) would make this airtight regardless of the actor's site
  visibility. Rejected for now: "Backend: None" is a hard constraint on this
  work.
- **Allowing free reorder and tolerating stale trees.** Rejected — silent data
  corruption.

## Consequences

- Residual risk: a partial-access admin could reorder a Level that looks empty
  in their `canAccessSites` view but is occupied in a subtree they cannot see.
  Accepted for v1; the airtight fix (backend guard or confirmed full visibility)
  is deferred. Delete is unaffected — the backend block backstops it.
- `level` is treated as a **sort key, not a contiguous sequence**: deletes leave
  gaps (backend does not renumber), so the UI always sorts by `level` and
  reasons about adjacency by sorted position, never `level - 1`.
