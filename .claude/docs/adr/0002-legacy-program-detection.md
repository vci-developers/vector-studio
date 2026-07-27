# Legacy programs are detected from their Sites, not from a program id

## Status

accepted

## Applies to

The shared program gate — the check that decides whether a Program sees the
hierarchy-era builders (Location Hierarchy Builder, Site Builder, form builder)
or the legacy empty state — and the legacy-program predicate it delegates to.

## Context & Decision

A **Legacy program** uses the old flat site schema (`district`, `subCounty`,
`villageName`, …) with no Location Types, so the hierarchy-era builders are
meaningless to it and must be hidden. The gate originally hardcoded
`programId === 1` (Uganda), written when Uganda was believed to be the only such
program. It is not: **ids 1, 2 and 4 are Legacy today**, and until the migration
lands more may be seeded. Under the hardcoded check, every Legacy program other
than Uganda was silently offered a builder that cannot work against its data.

We decided to detect Legacy **structurally, from the program's own Sites**, with
a small known-legacy-id set as a backstop. A program is Legacy when its id is in
that set, **or** when it has at least one accessible Site and _every_ accessible
Site carries an empty Location Hierarchy. This reads the same truth the backend
records — a Legacy Site's `locationHierarchy` is `{}`, a hierarchical Site's is
populated — so a newly-seeded Legacy program is classified correctly with no
code change, and a program becomes hierarchical on its own the moment its Sites
gain a hierarchy. The id set exists only to cover the one case site shape cannot
speak to: a Legacy user with **zero** accessible Sites, where "every Site is
flat" is vacuously true but there is no evidence either way. It is expected to
shrink to empty as programs migrate.

An **absent** hierarchy is read as an empty one, and therefore as Legacy. This
is the safe direction: the gate's failure mode when it guesses "hierarchical"
wrongly is exposing a builder that will produce nonsense against flat data,
whereas guessing "Legacy" wrongly shows an empty state that names the reason.

The predicate reads the accessible Sites already carried on the user's
permissions, so the gate gains no new query and keeps its existing shape.

## Considered alternatives

- **A program-level `isLegacy` flag from the backend.** Airtight and
  unambiguous, including for a user with no Sites. Rejected: no backend changes
  are in scope for this work. This remains the correct long-term fix, at which
  point both the site-shape heuristic and the id set are deleted.
- **Pure site shape, with no id set.** Simpler and fully self-healing, but
  leaves a real hole — a Legacy user whose accessible-site list is empty would
  be classified hierarchical and shown the builder.
- **Presence of Location Types for the program.** Misfires on a brand-new
  hierarchical program that has not defined its Levels yet, and forces an extra
  query into a gate that wraps many pages.

## Consequences

- Legacy detection now tracks data rather than a constant: adding a Legacy
  program no longer requires editing the gate, and a migrated program stops
  being Legacy once it is removed from the id set.
- The gate is shared, so this also corrects form-builder gating, which was
  offering the builder to Legacy programs 2 and 4.
- Residual risk: a Legacy program **not** in the id set whose current user has
  zero accessible Sites is classified hierarchical and would see the builder.
  Inert today — the three known Legacy programs are enumerated and all hold data
  — and closed for good by the backend flag above.
