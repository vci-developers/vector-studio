# VCV-231 · Step 4 — Scope & Identity in Diff and Viewer

> Slice 4 of 4. See [Step 0](./VCV-231-0-overview.md). Depends on Step 1
> (contracts); independent of Steps 2–3 at the data level but sequenced last so
> the diff reflects the finished authoring model. Assumes `.claude/CONTEXT.md`
> and ADR 0002.

## Problem Statement

The historical viewer compares a published version against the current draft
using the shared diff components. Those components know nothing about
`answerScope` or `isUnitIdentityComponent`, so a reviewer comparing v1 → v2 can't
see that a question became per-unit or that an identity component was toggled —
exactly the structural changes this feature introduces.

## Solution

Teach the version diff about the two new fields: group the diff into the same two
scope sections as the builder (Session / Per-unit), and treat an
`isUnitIdentityComponent` change as a field-level modification with an **Identity**
badge and the standard left/right change highlight. Because scope is immutable per
question, a scope difference can only appear as a removal from one section plus an
addition in the other — which the existing added/removed rendering already
handles.

## User Stories

1. As a reviewer, I want the version diff split into Session and Per-unit
   sections, so that I read changes at the same granularity I authored them.
2. As a reviewer, I want a per-unit question to show an "Identity" badge in the
   diff when it is an identity component, so that I can see which answers identify
   a unit in that version.
3. As a reviewer, I want a question that gained or lost identity between versions
   to be highlighted as modified, so that I notice the change.
4. As a reviewer, I want a question that moved scope (removed from one section,
   added to the other) to read clearly as a remove + add, so that I'm not
   confused by an impossible in-place scope change.
5. As a reviewer, I want the diff summary counts to include identity changes as
   modifications, so that the summary stays accurate.
6. As a reviewer, I want unchanged scope/identity to render exactly as before, so
   that nothing regresses in the existing diff.

## Implementation Decisions

- **Scope sections in the diff.** `diff-question-list.tsx` renders two grouped
  blocks (Session / Per-unit), each keyed by the question's `answerScope`,
  mirroring the builder's two-section layout. Baseline stays on the left, newer
  on the right (existing orientation).
- **Identity as a field change.** `form-version-diff.ts` adds
  `isUnitIdentityComponent` to the per-question field comparison so a toggle
  registers as a `modified` diff (and flows into the existing summary counts). No
  new diff *kind* is introduced.
- **No in-place scope change.** Scope is immutable per question id, so the diff
  never renders a scope "field change"; a scope difference manifests as
  removed-here + added-there, already covered by the added/removed cells. The
  section grouping is enough — no special-casing.
- **Identity badge + highlight.** `diff-question-cell.tsx` shows an "Identity"
  badge when the question is an identity component, and applies the standard
  side-appropriate change highlight (left = removed/destructive, right =
  added/success) when identity is among the field changes — mirroring how
  `required`/`type` changes are already highlighted.
- **Build inline-first, reuse existing shape.** No new util or intermediate type;
  extend the existing `QuestionDiff` field-change comparison and the existing
  cell/list components. Badge uses the shadcn `Badge` already imported in the
  cell.

## Files changed (3)

- [form-version-diff.ts](../../../src/features/form-builder/utils/form-version-diff.ts)
  — compare `isUnitIdentityComponent`; expose scope for grouping.
- [diff-question-list.tsx](../../../src/features/form-builder/components/diff/diff-question-list.tsx)
  — two scope-grouped sections.
- [diff-question-cell.tsx](../../../src/features/form-builder/components/diff/diff-question-cell.tsx)
  — identity badge + change highlight.

**Checkpoint:** `npm run typecheck && npm run lint && npm run format`.

## Testing Decisions

- **No automated tests this round.** Manual: check out a version, edit the draft
  to (a) add a per-unit question, (b) toggle an identity component, (c) delete a
  Session question and recreate it as per-unit; confirm the diff shows the
  per-unit section, an Identity badge, a modified highlight on the toggle, and the
  scope move as remove + add. Confirm the summary counts update.
- The field comparison in `form-version-diff.ts` is pure and already the kind of
  logic that would be unit-tested first once a runner exists.

## Out of Scope

- A standalone read-only single-version render — the historical viewer always
  diffs against the draft, so identity/scope surface through the diff components;
  no separate viewer surface exists to change.
- CSV export coverage of the new fields.
- Any authoring behavior (Steps 2–3).

## Further Notes

- The historical viewer wires the same diff components, so this step lights up
  both the version-comparison and the "review before checkout/publish" surfaces
  at once.
