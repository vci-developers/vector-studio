# VCV-231 · Step 0 — Overview & Change Map

Authoring **Session** vs **Session Unit** questions in the form builder. Read
`.claude/CONTEXT.md` (Forms & Sessions) and
`.claude/docs/adr/0002-form-answer-scope-and-unit-identity.md` first — every step
assumes their domain language and invariants.

## Problem Statement

The form builder only authors **Session-level** questions — one answer per
Session. A Dynamic Form program also collects data per **Session Unit** (a
trap/room repeated within one visit). An admin has no way to mark a question as
answered per unit, and no way to designate which per-unit answers **identify** a
unit so the review layer can match "the same" unit across visits. Those forms can
only be built today by raw API calls.

## Solution

Extend the builder so each question carries an **answer scope** (`SESSION` |
`SESSION_UNIT`) and, for per-unit questions, an **identity** flag
(`isUnitIdentityComponent`). Questions live in two sections — **Session** and
**Per-unit** — with scope chosen by the section you add to and immutable
thereafter. Within the Per-unit section the admin marks identity components, and
the builder enforces the invariants that keep every unit groupable. Scope and
identity round-trip through the contracts and surface in the version diff.

## Domain model (fixed — see ADR 0002 & CONTEXT.md)

- **Scope is immutable** after creation; changing it is delete-and-recreate.
- **Identity is toggled at a root and inherited down the whole subtree** (no
  islands); this enables branch-specific composite identity (AC / AD / BE).
- **An identity root may not have a visibility rule** (it must be always
  present); descendants branch freely. Non-identity roots keep the freedom to be
  conditional.
- **Identity ⇒ required**, and **a per-unit form needs ≥ 1 identity component**.
- **Prerequisites never cross scope** (same-scope only; asymmetric relaxation
  deferred).
- **Backend is already done**: `answerScope` (enum, optional) and
  `isUnitIdentityComponent` (boolean, optional) exist on the question object and
  the POST/PUT bodies. Pre-existing questions omit them → default to `SESSION` /
  `false`.

## Steps

Each step is one commit-sized slice of **3–5 file changes**, built incrementally
(data first, then UI-first one sub-functionality at a time per best-practices
rule 8). Utilities are **not** pre-declared — they precipitate only on real
reuse/friction.

| Step | Slice | Files |
| ---- | ----- | ----- |
| 1 | [Contracts & data layer](./VCV-231-1-contracts.md) | 3 |
| 2 | [Two-section builder & scope authoring](./VCV-231-2-two-section-builder.md) | 5 |
| 3 | [Unit identity, same-scope prerequisites & publish gate](./VCV-231-3-unit-identity-and-form-validity.md) | 5 |
| 4 | [Scope & identity in diff and viewer](./VCV-231-4-diff-and-viewer.md) | 3 |

**Expected total: ~15 files changed** (14 distinct; `question-form.tsx` evolves
across steps 2 and 3).

### Change map (every file, by step)

**Step 1 — Contracts (3)**

- [form-question-schema.ts](../../../src/api/form-question/contracts/form-question-schema.ts)
  — add `answerScope` (default `SESSION`) + `isUnitIdentityComponent` (default
  `false`).
- [post-question-to-draft-form-schema.ts](../../../src/api/form-question/contracts/post-question-to-draft-form-schema.ts)
  — add both fields to the request body.
- [put-question-to-draft-form-schema.ts](../../../src/api/form-question/contracts/put-question-to-draft-form-schema.ts)
  — add both fields to the request body.

_(Server functions, BFF routes and hooks are pass-through — verified — and need
no change.)_

**Step 2 — Two-section builder & scope authoring (5)**

- [draft-editor.tsx](../../../src/features/form-builder/draft-editor/components/editor/draft-editor.tsx)
  — track the scope of the question being added; pass it to the sheet.
- [question-list.tsx](../../../src/features/form-builder/draft-editor/components/question/question-list.tsx)
  — render two sections (Session / Per-unit) with per-scope roots + notes + add
  buttons.
- [question-form-sheet.tsx](../../../src/features/form-builder/draft-editor/components/question/question-form-sheet.tsx)
  — carry the new question's scope; per-scope title/description.
- [question-form.tsx](../../../src/features/form-builder/draft-editor/components/question/question-form.tsx)
  — send `answerScope` on create; a follow-up inherits its parent's scope.
- [question-order.ts](../../../src/features/form-builder/draft-editor/utils/question-order.ts)
  — reorder swaps only **same-scope** root siblings (`getNextQuestionOrder`
  stays a global unique key).

**Step 3 — Unit identity, same-scope prerequisites & publish gate (5)**

- [question-form-schema.ts](../../../src/features/form-builder/draft-editor/validation/question-form-schema.ts)
  — add `isUnitIdentityComponent`; refine identity ⇒ required.
- [question-form.tsx](../../../src/features/form-builder/draft-editor/components/question/question-form.tsx)
  — identity toggle on unit roots (lock `required`, hide the visibility editor),
  follow-up inherits identity, first-unit default-on, last-identity backstop,
  pass scope to the prerequisite editor.
- [question-card.tsx](../../../src/features/form-builder/draft-editor/components/question/question-card.tsx)
  — identity badge on cards.
- [prerequisite-editor.tsx](../../../src/features/form-builder/draft-editor/components/prerequisite/prerequisite-editor.tsx)
  — offer only same-scope questions as rule targets.
- [publish-sheet.tsx](../../../src/features/form-builder/draft-editor/components/publish/publish-sheet.tsx)
  — block publish when per-unit questions exist with no identity component.

**Step 4 — Diff & viewer (3)**

- [form-version-diff.ts](../../../src/features/form-builder/utils/form-version-diff.ts)
  — group diffs by scope; detect an `isUnitIdentityComponent` change as a
  modification.
- [diff-question-list.tsx](../../../src/features/form-builder/components/diff/diff-question-list.tsx)
  — render the diff in two scope sections.
- [diff-question-cell.tsx](../../../src/features/form-builder/components/diff/diff-question-cell.tsx)
  — identity badge + identity-change highlight.

## Sequencing & dependencies

```
Step 1 (contracts) ─▶ Step 2 (two-section builder) ─▶ Step 3 (identity + rules) ─▶ Step 4 (diff)
```

Step 1 is the foundation everything derives from. Step 2 makes scope authorable;
Step 3 layers the identity + validity rules on top of the sections; Step 4 is
independent of 2–3 at the data level (it only reads the fields) but is sequenced
last so the diff reflects the finished authoring model.

## Testing Decisions

- **No automated tests this round** — no runner in the repo (only `typecheck`,
  `lint`, `format`), consistent with VCV-203/208. Confidence = typecheck + lint +
  manual verification per step.
- Pure functions that precipitate on demand (the same-scope target filter, the
  ≥1-identity publish predicate, the per-scope reorder) are written with no
  React/state/side effects and become the first unit-test targets once a runner
  lands. Prior art: `question-order`, `walk-questions`.

## Out of Scope (whole epic)

- **Answer submission** (mobile/field per-unit recording) — only *consumes*
  `answerScope`.
- **Review / reconciliation** (Metadata Conflict, Review Unit) — downstream.
- **CSV export** changes; **backend** changes (fields already exist).
- **Legacy / Surveillance programs** — the builder is Dynamic-only.
- **Editable scope** (cross-scope moves) — excluded by ADR 0002.

## Further Notes

- Domain language & invariants: `.claude/CONTEXT.md` (Forms & Sessions).
- Decision record: `.claude/docs/adr/0002-form-answer-scope-and-unit-identity.md`.
