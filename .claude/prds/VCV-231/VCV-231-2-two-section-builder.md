# VCV-231 · Step 2 — Two-Section Builder & Scope Authoring

> Slice 2 of 4. See [Step 0](./VCV-231-0-overview.md). Depends on Step 1
> (contracts). Assumes `.claude/CONTEXT.md` and ADR 0002.

## Problem Statement

Now that a question can carry `answerScope`, the builder still shows a single
flat list and every new question is implicitly `SESSION`. There is no way to
author a per-unit question, and no visible distinction between the two
granularities the field app collects on separate screens.

## Solution

Split the draft editor's question area into two labelled sections — **Session
questions** and **Per-unit questions** — each with a short explainer, its own
"Add" button, and its own reorder. The section you add from **is** the scope
choice: a question created in the Per-unit section is `SESSION_UNIT`, and scope
is immutable thereafter (no selector in the edit sheet). A follow-up inherits its
parent's scope. Reorder swaps only same-scope root siblings.

## User Stories

1. As a program admin, I want Session and Per-unit questions in two labelled
   sections, so that I always know which granularity I'm editing.
2. As a program admin, I want a short note on each section explaining it, so that
   I understand "per unit" without external docs.
3. As a program admin, I want an "Add" button in each section, so that creating a
   question there sets its scope automatically.
4. As a program admin, I want a per-unit question I create to be answered once per
   Session Unit, so that repeated sub-units are captured correctly.
5. As a program admin, I want a follow-up to take its parent's scope
   automatically, so that a question tree never mixes granularities.
6. As a program admin, I want the edit sheet to have no scope control, so that I'm
   not offered an edit the system doesn't support.
7. As a program admin who wants to change a question's scope, I want to delete and
   recreate it in the other section, so that the change is explicit and safe.
8. As a program admin, I want to reorder questions within a section without
   affecting the other section, so that ordering stays sensible per screen.
9. As a program admin, I want each section to show its own empty state, so that an
   empty Per-unit section reads as "optional / add if you collect per-unit data".
10. As a program admin, I want existing (Session) questions to keep working
    unchanged, so that nothing regresses.

## Implementation Decisions

- **Section = scope.** The Session section renders root questions with
  `answerScope === 'SESSION'`; the Per-unit section renders
  `answerScope === 'SESSION_UNIT'`. Each renders its scope's roots sorted by
  `order`, with the existing card/subtree rendering unchanged.
- **Add flow carries scope.** `draft-editor.tsx` tracks the scope of the question
  being added (alongside the existing `parentIdForNewQuestion`) and threads it to
  the sheet; `question-form.tsx` sends it as `answerScope` on create. A
  **follow-up** ignores the section and inherits the parent question's
  `answerScope`.
- **No scope selector in the sheet.** Scope is set only at create time and is
  immutable; the edit sheet exposes label/type/required/options/visibility as
  today.
- **Reorder is scope-aware.** `swapAdjacentSiblings` must resolve a root
  question's sibling group to the **same-scope roots** (today it returns all
  roots). `getNextQuestionOrder` stays `max(order) + 1` across the whole draft —
  one global unique sort key; sections only filter and sort. (The field app
  renders the scopes on separate screens, so a shared global order never
  interleaves at collection time.)
- **Build inline-first.** No new util is pre-declared; the same-scope sibling
  resolution is folded into the existing `question-order.ts` (it already owns
  sibling lookup). Extract further only on real reuse.
- Section notes and labels are extracted as named constants (no hardcoded UI
  strings in JSX).

## Files changed (5)

- [draft-editor.tsx](../../../src/features/form-builder/draft-editor/components/editor/draft-editor.tsx)
  — track + thread the new question's scope.
- [question-list.tsx](../../../src/features/form-builder/draft-editor/components/question/question-list.tsx)
  — two sections, per-scope roots, notes, per-section add + empty state.
- [question-form-sheet.tsx](../../../src/features/form-builder/draft-editor/components/question/question-form-sheet.tsx)
  — carry scope for a new question; per-scope title/description.
- [question-form.tsx](../../../src/features/form-builder/draft-editor/components/question/question-form.tsx)
  — send `answerScope` on create; follow-up inherits parent scope.
- [question-order.ts](../../../src/features/form-builder/draft-editor/utils/question-order.ts)
  — same-scope root sibling group for reorder.

**Checkpoint:** `npm run typecheck && npm run lint && npm run format`.

## Testing Decisions

- **No automated tests this round.** Manual: add a Session question and a Per-unit
  question; confirm they land in the right sections and persist across reload;
  add a follow-up under each and confirm it inherits scope; reorder within a
  section and confirm the other section is untouched.
- The same-scope reorder resolution is pure and becomes a unit-test target once a
  runner exists (given a draft + a root id + direction → the two `{ id, order }`
  swaps stay within scope).

## Out of Scope

- The identity toggle, its locks, and the ≥1-identity rule — Step 3.
- Same-scope prerequisite filtering — Step 3.
- Diff/viewer changes — Step 4.
- Any scope-edit affordance (deliberately excluded — delete/recreate).

## Further Notes

- Scope immutability means the edit sheet never shows a scope control; the only
  place scope is chosen is the section's Add button.
