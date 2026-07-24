# VCV-231 · Step 4 — Scope & Identity in Diff and Viewer

> **Status: ✅ DONE (2026-07-23).** `typecheck` + `lint` + `prettier --check`
> all green in-session; reviewer manual pass pending. Final slice of VCV-231 —
> see the implementation note and **epic closeout** at the end.
>
> Slice 4 of 4. See [Step 0](./VCV-231-0-overview.md). Depends on Step 1
> (contracts); independent of Steps 2–3 at the data level but sequenced last so
> the diff reflects the finished authoring model. Assumes `.claude/CONTEXT.md`
> and ADR 0002.

## Problem Statement

The historical viewer compares a published version against the current draft
using the shared diff components. Those components know nothing about
`answerScope` or `isUnitIdentityComponent`, so a reviewer comparing v1 → v2
can't see that a question became per-unit or that an identity component was
toggled — exactly the structural changes this feature introduces.

## Solution

Teach the version diff about the two new fields: group the diff into the same
two scope sections as the builder (Session / Per-unit), and treat an
`isUnitIdentityComponent` change as a field-level modification with an
**Identity** badge and the standard left/right change highlight. Because scope
is immutable per question, a scope difference can only appear as a removal from
one section plus an addition in the other — which the existing added/removed
rendering already handles.

## User Stories

1. As a reviewer, I want the version diff split into Session and Per-unit
   sections, so that I read changes at the same granularity I authored them.
2. As a reviewer, I want a per-unit question to show an "Identity" badge in the
   diff when it is an identity component, so that I can see which answers
   identify a unit in that version.
3. As a reviewer, I want a question that gained or lost identity between
   versions to be highlighted as modified, so that I notice the change.
4. As a reviewer, I want a question that moved scope (removed from one section,
   added to the other) to read clearly as a remove + add, so that I'm not
   confused by an impossible in-place scope change.
5. As a reviewer, I want the diff summary counts to include identity changes as
   modifications, so that the summary stays accurate.
6. As a reviewer, I want unchanged scope/identity to render exactly as before,
   so that nothing regresses in the existing diff.

## Implementation Decisions

- **Scope sections in the diff.** `diff-question-list.tsx` renders two grouped
  blocks (Session / Per-unit), each keyed by the question's `answerScope`,
  mirroring the builder's two-section layout. Baseline stays on the left, newer
  on the right (existing orientation).
- **Identity as a field change.** `form-version-diff.ts` adds
  `isUnitIdentityComponent` to the per-question field comparison so a toggle
  registers as a `modified` diff (and flows into the existing summary counts).
  No new diff _kind_ is introduced.
- **No in-place scope change.** Scope is immutable per question id, so the diff
  never renders a scope "field change"; a scope difference manifests as
  removed-here + added-there, already covered by the added/removed cells. The
  section grouping is enough — no special-casing.
- **Identity badge + highlight.** `diff-question-cell.tsx` shows an "Identity"
  badge when the question is an identity component, and applies the standard
  side-appropriate change highlight (left = removed/destructive, right =
  added/success) when identity is among the field changes — mirroring how
  `required`/`type` changes are already highlighted.
- **Build inline-first, reuse existing shape.** No new util or intermediate
  type; extend the existing `QuestionDiff` field-change comparison and the
  existing cell/list components. Badge uses the shadcn `Badge` already imported
  in the cell.

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
  per-unit section, an Identity badge, a modified highlight on the toggle, and
  the scope move as remove + add. Confirm the summary counts update.
- The field comparison in `form-version-diff.ts` is pure and already the kind of
  logic that would be unit-tested first once a runner exists.

## Out of Scope

- A standalone read-only single-version render — the historical viewer always
  diffs against the draft, so identity/scope surface through the diff
  components; no separate viewer surface exists to change.
- CSV export coverage of the new fields.
- Any authoring behavior (Steps 2–3).

## Further Notes

- The historical viewer wires the same diff components, so this step lights up
  both the version-comparison and the "review before checkout/publish" surfaces
  at once.

---

## What was implemented (✅ done)

Verified on disk; `typecheck`, `lint`, and `prettier --check` on the three
touched files all pass (run in-session). Exactly the 3 planned files changed.

- **`form-version-diff.ts`** — `isUnitIdentityComponent` added to the
  `QuestionDiff['fieldChanges']` type and compared in `computeFieldChanges` (a
  toggle registers as a `modified` field change, flowing into the existing
  `summary.modified` count — no new diff kind, no summary change). The entry
  point now **partitions root questions by `answerScope`** and runs
  `buildSiblingDiffs` once per scope, concatenating into the same flat
  `questionDiffs` return; `diffSummary` accumulates across both calls.
- **`diff-question-list.tsx`** — groups the flat `questionDiffs` into two scope
  sections ("Session questions" / "Per-collection questions", matching the
  builder's wording in `question-list.tsx`) via a local `resolveDiffScope`
  reading `answerScope` off each diff's `to ?? from` question. The single
  from/left · to/right column header stays at the top (orientation preserved);
  empty sections are filtered out.
- **`diff-question-cell.tsx`** — a `variant="secondary"` **"Identity"** badge
  beside the label when `question.isUnitIdentityComponent`; when identity is
  among the field changes, the badge takes the standard side-appropriate
  highlight (`bg-destructive/20` left = lost identity, `bg-success/20` right =
  gained identity), mirroring how `required`/`type` changes are highlighted.

## Deviations from the plan (each justified)

1. **Matcher scope-partitioned at the entry point** (plan said section grouping
   in the list "is enough — no special-casing"). The similarity matcher is
   greedy on label/type/position, **not** id-based, so without partitioning a
   deleted `SESSION` question + a similar added `SESSION_UNIT` question would
   false-match into a single cross-scope `modified` pair — contradicting
   immutable scope (ADR 0002) and unrenderable in a scope-grouped layout.
   Running the matcher once per scope is precisely what makes the plan's stated
   "a scope move manifests as remove-here + add-there" actually hold. Genuine
   same-scope pairs match identically to before; an all-`SESSION` baseline
   behaves exactly as pre-epic (the unit partition is empty on both sides).
2. **Empty scope sections are filtered out** (not in the plan). A form with only
   Session questions renders just the "Session questions" header rather than an
   empty "Per-collection questions" block; the absence reads as "no per-unit
   changes." Every top-level diff is single-scope (guaranteed by deviation 1),
   so grouping is unambiguous.
3. **Inline UI strings, not named constants** — per standing direction and the
   Step 2–3 precedent. Section titles are inline literals; the only user-facing
   "collection" text is the section header string. No `SCOPE_SECTION_TITLES`
   map. Identifiers stay `unit` / `SESSION_UNIT` / `answerScope` /
   `isUnitIdentityComponent`.
4. **No inline comments / no `// see ADR 0002` markers** — continues the
   self-explanatory-code convention from Step 3 (see the stale-ADR note below).
5. **No util extracted.** `resolveDiffScope` (list) is a two-line pure helper
   used only within its file; identity detection is one field comparison inside
   the existing `computeFieldChanges`. Nothing precipitated a `utils/` file.
   Minor: on apply, `resolveDiffScope` and the pre-existing `describeParentSide`
   ended up nested inside their component functions rather than at module scope
   — pure and correct, cosmetic only; left as-is.

## Downstream impact & how to address it

- **The identity-toggle cascade gap (Step 3) is now user-visible in the diff.**
  The diff faithfully renders each question's **stored**
  `isUnitIdentityComponent` flag. Because toggling an existing root's identity
  _off_ PUTs only the root, its follow-ups keep `isUnitIdentityComponent: true`
  in storage — so the diff will show those follow-ups with an "Identity" badge
  while their root no longer has one. This is a **correct rendering of stored
  data**, not a Step 4 bug; it makes the carried-over Step 3 cascade gap visible
  on a new surface. Still needs a decision (cascade the toggle to the subtree,
  bar toggling-off on a root with follow-ups, or derive identity from the root
  in review). **Not fixed here** — the fix lives in authoring/review, outside
  Step 4's 3-file scope.
- **Diff/viewer needs no further scope/identity work.** Both the publish sheet
  and the historical viewer consume the unchanged `{ questionDiffs, summary }`
  shape and `DiffQuestionList` props, so both surfaces were lit up without
  edits.

## Testing status

- `typecheck` + `lint` + `prettier --check` (three touched files) green, run
  in-session. No automated tests (no runner).
- Manual verification to be run by the reviewer on a Dynamic (non-Uganda)
  program: open the publish sheet on a draft that adds a per-collection question
  and toggles identity on an existing root → the diff renders two scope sections
  with correct left/right orientation, an "Identity" badge on identity
  questions, a side-tinted Identity badge + amber "Modified" on the toggled
  root, a scope move reads as remove + add, and there is no spurious
  scope/identity noise against a pre-epic (all-`SESSION`) baseline.
- First unit-test targets once a runner lands: `computeFieldChanges` (identity
  as a field change) and the scope-partitioned matching (a cross-scope
  near-duplicate stays remove + add, never a single `modified`).

---

## Epic closeout (VCV-231 — all 4 slices done)

**File-count reconciliation.** Step 0 predicted **~15 files (14 distinct;
`question-form.tsx` across steps 2 & 3)**. Actual working-tree total: **17 src
files** — 15 modified, 1 added, 1 deleted. The +2 over estimate is entirely
**Step 2's two-section refactor**, neither entry in the Step 0 change map:

- `question-scope-section.tsx` — **new** component extracted for the per-scope
  section (the map folded this into `question-list.tsx`).
- `no-questions-empty-state.tsx` — **deleted**; the single-list empty state was
  replaced by per-section empty-state notes.

Step 4 itself hit **exactly** its 3 predicted files. The "~15" estimate held to
within +2, both deltas from a reasonable Step 2 componentization.

**Open follow-ups carried past the epic (neither is a VCV-231 code gap):**

1. **Identity-toggle cascade gap** — still undecided; now visible in the diff
   (see Downstream above). Belongs to authoring/review, not the diff slice.
   Recommend a small follow-up ticket to pick one of the three remedies.
2. **Stale ADR-0002 "Applies to"** — it still tells readers to grep for
   `// see ADR 0002` markers that the no-comments convention intentionally omits
   (flagged since Step 3; Step 4 kept the convention). Recommend updating the
   ADR's "Applies to" to point at the identity/scope derivation, the
   prerequisite filter, the publish gate, and now the diff by **location**, and
   syncing the recorded ADR-conventions memory — a docs edit, done when you're
   ready, not a code change.

No domain decision shifted in Step 4 (read-only rendering), so `CONTEXT.md` is
unchanged.
