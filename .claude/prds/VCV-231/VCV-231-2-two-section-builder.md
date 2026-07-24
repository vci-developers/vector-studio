# VCV-231 · Step 2 — Two-Section Builder & Scope Authoring

> **Status: ✅ DONE (2026-07-23).** `typecheck` / `lint` / `prettier` all clean.
> See the implementation note at the end for what shipped, deviations, and their
> downstream impact.
>
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
is immutable thereafter (no selector in the edit sheet). A follow-up inherits
its parent's scope. Reorder swaps only same-scope root siblings.

## User Stories

1. As a program admin, I want Session and Per-unit questions in two labelled
   sections, so that I always know which granularity I'm editing.
2. As a program admin, I want a short note on each section explaining it, so
   that I understand "per unit" without external docs.
3. As a program admin, I want an "Add" button in each section, so that creating
   a question there sets its scope automatically.
4. As a program admin, I want a per-unit question I create to be answered once
   per Session Unit, so that repeated sub-units are captured correctly.
5. As a program admin, I want a follow-up to take its parent's scope
   automatically, so that a question tree never mixes granularities.
6. As a program admin, I want the edit sheet to have no scope control, so that
   I'm not offered an edit the system doesn't support.
7. As a program admin who wants to change a question's scope, I want to delete
   and recreate it in the other section, so that the change is explicit and
   safe.
8. As a program admin, I want to reorder questions within a section without
   affecting the other section, so that ordering stays sensible per screen.
9. As a program admin, I want each section to show its own empty state, so that
   an empty Per-unit section reads as "optional / add if you collect per-unit
   data".
10. As a program admin, I want existing (Session) questions to keep working
    unchanged, so that nothing regresses.

## Implementation Decisions

- **Section = scope.** The Session section renders root questions with
  `answerScope === 'SESSION'`; the Per-unit section renders
  `answerScope === 'SESSION_UNIT'`. Each renders its scope's roots sorted by
  `order`, with the existing card/subtree rendering unchanged.
- **Add flow carries scope.** `draft-editor.tsx` tracks the scope of the
  question being added (alongside the existing `parentIdForNewQuestion`) and
  threads it to the sheet; `question-form.tsx` sends it as `answerScope` on
  create. A **follow-up** ignores the section and inherits the parent question's
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

- **No automated tests this round.** Manual: add a Session question and a
  Per-unit question; confirm they land in the right sections and persist across
  reload; add a follow-up under each and confirm it inherits scope; reorder
  within a section and confirm the other section is untouched.
- The same-scope reorder resolution is pure and becomes a unit-test target once
  a runner exists (given a draft + a root id + direction → the two
  `{ id, order }` swaps stay within scope).

## Out of Scope

- The identity toggle, its locks, and the ≥1-identity rule — Step 3.
- Same-scope prerequisite filtering — Step 3.
- Diff/viewer changes — Step 4.
- Any scope-edit affordance (deliberately excluded — delete/recreate).

## Further Notes

- Scope immutability means the edit sheet never shows a scope control; the only
  place scope is chosen is the section's Add button.

---

## What was implemented (✅ done)

Verified on disk; `typecheck`, `lint`, and `prettier --check` all pass.

- **`question-order.ts`** — `swapAdjacentSiblings` filters the resolved sibling
  group to the moved question's `answerScope` before swapping (`indexOf` on the
  already-found node). Root → same-scope roots; below the root it's a no-op.
  `getNextQuestionOrder` unchanged (global `max(order)+1`).
- **`draft-editor.tsx`** — new `answerScopeForNewQuestion` state; the
  `onAddQuestion` handler stores `(parentId, answerScope)` and threads the scope
  to the sheet. No tree-walk.
- **`question-list.tsx`** — renders two `QuestionScopeSection`s; all copy is
  passed **inline** at the call sites (no per-string constants).
- **`question-scope-section.tsx`** _(new file)_ — the section component,
  extracted to its own file. Derives its own scope-filtered, order-sorted roots
  from `draft`; header + always-visible Add button + light empty-state Card +
  the unchanged `QuestionCard` list.
- **`question-form-sheet.tsx`** — inline title/description ternaries (no
  constants); title is scope-aware for a new root, description is generic.
- **`question-form.tsx`** — sends `answerScope` on **CREATE only**; edit/PUT
  omits it (immutable). `isUnitIdentityComponent` not sent (Step 3).
- **`question-card.tsx`** — `onAddQuestion` now carries the new question's
  scope; "Add follow-up" passes `question.answerScope` (a follow-up inherits its
  parent's scope at the source — no lookup).
- **`no-questions-empty-state.tsx`** — **deleted** (its only consumer was
  `question-list`; per-section empty states replaced it).

## Deviations from the plan (each justified)

1. **`question-card.tsx` was touched** (the plan reserved it for Step 3). The
   cleanest data flow has the card pass the parent's `answerScope` it already
   holds, which removes a tree-walk entirely and makes the callback signature
   honest (`(parentId, answerScope)`). No Step-3 work (no identity badge) was
   done here. **Net Step-2 footprint: 6 modified + 1 new + 1 deleted, not 5.**
2. **Inline UI strings instead of named constants** (plan asked for constants) —
   per explicit direction; also matches the original sheet's inline pattern. No
   `collection`/`session` string is duplicated (each appears once at its call
   site).
3. **Sheet description is generic, not per-scope** — the section note already
   explains the scope, so only the sheet **title** is scope-aware. Removed the
   per-scope description `Record` as over-engineering.
4. **`QuestionScopeSection` lives in its own file**
   (`question-scope-section.tsx`) rather than inline in `question-list.tsx`. It
   is a component, not a util.
5. **UI language = "collection", code = "unit".** A Session Unit is surfaced to
   admins as a **collection** ("Per-collection questions", "each collection …");
   all code/schemas keep `SESSION_UNIT` / `unit` / `isUnitIdentityComponent`.
   Recorded in `CONTEXT.md` (Forms & Sessions → Session Unit). This is a **new,
   epic-wide convention**, not a one-off.

## Downstream impact & how to address it

- **Step 3 (identity) builds on an already-scope-aware card.** `onAddQuestion`
  is now `(parentId: number | null, answerScope: FormQuestionScope) => void` and
  `FormQuestionScope` is already imported in `question-card.tsx`. The identity
  badge is additive — no rework, no conflict.
- **Step 3 & 4 must apply the collection/unit language split.** Every new
  user-facing string — identity toggle label, publish-gate error, diff/viewer
  scope headers — uses **"collection"**; the code keeps
  `isUnitIdentityComponent` / `SESSION_UNIT`. (e.g. surface "This collection
  needs at least one identifying question", not "unit".) Enforced by the
  `CONTEXT.md` rule.
- **Step 0 change map is slightly stale**: Step 2 is 6+1+1, and
  `no-questions-empty-state.tsx` no longer exists. Update the counts there if
  you want the map exact; behaviourally nothing else shifts.
- **Nit — restore the ADR pointer.** The same-scope reorder filter in
  `question-order.ts` lost its `// see ADR 0002` comment during apply; ADR
  0002's "Applies to" section tells readers to look for that marker. Recommend
  re-adding one line above the `.filter(...)`.

## Testing status

- Manual verification per the plan (add Session + per-collection question, add a
  follow-up under each and confirm inherited scope, reorder within a section
  leaving the other untouched) — to be run by the reviewer in `npm run dev` on a
  Dynamic (non-Uganda) program.
- The same-scope reorder resolution remains the first unit-test target once a
  runner exists.
