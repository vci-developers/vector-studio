# VCV-231 · Step 3 — Unit Identity, Same-Scope Prerequisites & Publish Gate

> **Status: ✅ DONE (2026-07-23).** `typecheck` + `lint` pass in-session; reviewer
> manual pass pending. See the implementation note at the end for what shipped,
> deviations, and downstream impact.
>
> Slice 3 of 4. See [Step 0](./VCV-231-0-overview.md). Depends on Steps 1–2.
> Assumes `.claude/CONTEXT.md` and ADR 0002 — this step **implements** those
> invariants.

## Problem Statement

Per-unit questions can now be authored, but a Session Unit has no intrinsic
identity, so its answers can't yet be matched across visits. The builder needs to
let admins mark **identity components**, and must make the invariants that keep a
unit groupable unrepresentable rather than something you discover at publish:
identity ⇒ required, identity roots are always present, identity inherits down a
subtree, and a per-unit form has ≥ 1 identity component. Prerequisites must also
stop crossing scope.

## Solution

Add an **Identity component** toggle to the question sheet for **root**
`SESSION_UNIT` questions. Turning it on locks `required` on and hides the
visibility-rule editor (an identity root is always present); follow-ups show a
read-only "Part of unit identity" state inherited from their root. The first
per-unit question defaults identity on; the last remaining identity toggle can't
be switched off. The visibility-rule editor offers only same-scope questions. A
client-side publish gate blocks publishing a form that has per-unit questions but
no identity component.

## User Stories

1. As a program admin, I want to mark a per-unit question as an identity
   component, so that units can be told apart across visits.
2. As a program admin, I want identity questions to become required automatically
   and stay required, so that a unit can never have a blank identity.
3. As a program admin, I want an identity root to have no visibility rule, so that
   every unit always answers it.
4. As a program admin, I want the follow-ups of an identity question to be
   identity components too, so that branch-specific answers (AC / AD / BE) keep
   units distinct.
5. As a program admin, I want a follow-up's identity to be inherited and shown
   read-only, so that I can't create an inconsistent island.
6. As a program admin, I want the first per-unit question to default to being an
   identity component, so that I fall into the valid case by default.
7. As a program admin, I want to be stopped from turning off the last identity
   component, so that I can't strip a per-unit form into an invalid state.
8. As a program admin, I want to move identity from one question to another by
   turning the new one on before the old one off, so that there's always ≥ 1.
9. As a program admin, I want a question card to show an "Identity" badge, so that
   I can see at a glance which answers identify a unit.
10. As a program admin, I want a visibility rule to reference only questions of
    the same scope, so that I don't build a rule that can't be evaluated.
11. As a program admin, I want publishing blocked with a clear message if my
    per-unit form has no identity component, so that I never publish ungroupable
    units.
12. As a program admin editing a Session question, I want no identity control, so
    that identity stays a per-unit concept only.

## Implementation Decisions

- **Identity toggle placement.** Shown only for a **root** `SESSION_UNIT`
  question (`parentId === null`). Hidden entirely for `SESSION` questions and for
  follow-ups; a follow-up under an identity root shows a read-only "Part of unit
  identity" indicator derived from its root.
- **Locks make invariants unrepresentable.** Turning identity on sets `required`
  true and disables the Required switch (hint: "Identity questions are always
  required"), and hides/clears the visibility-rule editor (an identity root must
  be always present). Turning it off re-enables both.
- **Inheritance on create.** A follow-up created under an identity root is sent
  with `isUnitIdentityComponent: true`; under a non-identity root, `false`. No
  per-follow-up choice — mirrors scope inheritance from Step 2.
- **First-unit default + last-identity backstop.** When the Per-unit section has
  no identity root yet, a new root's toggle defaults on. When exactly one
  identity root remains, its toggle is disabled in the off-direction (hint:
  "A per-unit form needs at least one identity question — mark another first").
  Both read the current draft, computed inline.
- **Same-scope prerequisites.** The prerequisite editor filters its referenceable
  targets to the **same** `answerScope` as the question being edited (a new
  question's scope comes from the section/parent, passed in from
  `question-form.tsx`). `SESSION` ↔ `SESSION` and `SESSION_UNIT` ↔ `SESSION_UNIT`
  only; the asymmetric relaxation stays deferred (ADR 0002).
- **Publish gate.** Before firing the publish mutation, `publish-sheet.tsx`
  checks: if any `SESSION_UNIT` question exists and no root `SESSION_UNIT`
  question has `isUnitIdentityComponent`, block with a specific message. This
  backstops the inline last-identity guard (covers the delete path). A stray
  backend rejection surfaces as a toast but is not relied upon.
- **Build inline-first.** The "has a per-unit question but no identity" predicate
  and the "is this the last identity root" check are written inline; extract a
  pure `draftHasUnitQuestionsButNoIdentity(draft)` only if reused across the sheet
  and publish gate (likely — flag as the first extraction candidate).
- Hints/messages are named constants, not inline JSX strings.

## Files changed (5)

- [question-form-schema.ts](../../../src/features/form-builder/draft-editor/validation/question-form-schema.ts)
  — add `isUnitIdentityComponent`; refine identity ⇒ required.
- [question-form.tsx](../../../src/features/form-builder/draft-editor/components/question/question-form.tsx)
  — identity toggle + locks, inheritance on create, first-unit default,
  last-identity backstop, pass scope to the prerequisite editor.
- [question-card.tsx](../../../src/features/form-builder/draft-editor/components/question/question-card.tsx)
  — identity badge.
- [prerequisite-editor.tsx](../../../src/features/form-builder/draft-editor/components/prerequisite/prerequisite-editor.tsx)
  — same-scope target filter.
- [publish-sheet.tsx](../../../src/features/form-builder/draft-editor/components/publish/publish-sheet.tsx)
  — ≥ 1-identity publish gate.

**Checkpoint:** `npm run typecheck && npm run lint && npm run format`.

## Testing Decisions

- **No automated tests this round.** Manual: mark a per-unit root identity →
  Required locks on and the visibility editor disappears; add follow-ups → they
  inherit identity read-only; try to publish a per-unit form with no identity →
  blocked with the message; add a second identity, remove the first → allowed;
  confirm a `SESSION_UNIT` rule can't target a `SESSION` question and vice versa.
- The publish predicate and same-scope filter are pure and are the first
  unit-test targets once a runner exists (draft → publishable?; question scope +
  draft → eligible targets).

## Out of Scope

- Diff/viewer changes — Step 4.
- The asymmetric prerequisite relaxation (`SESSION_UNIT` may depend on `SESSION`)
  — deferred per ADR 0002.
- Any backend-side enforcement of the ≥1-identity rule (client gate is the UX).

## Further Notes

- All three concerns here enforce **one** thing: a per-unit form whose units can
  always be identified. They ship together because they are the rules that make
  Step 2's per-unit section valid.

---

## What was implemented (✅ done)

Verified on disk; `typecheck` and `lint` both pass (run in-session).

- **`question-form-schema.ts`** — added `isUnitIdentityComponent: z.boolean()`; a
  second `.refine` enforces identity ⇒ required.
- **`question-form.tsx`** — identity toggle ("Identifies this collection") shown
  only on unit-scoped **roots**; a read-only "Part of collection identity"
  indicator on identity follow-ups; the Required switch locks on (with a plain
  hint) whenever the question is identity; the visibility-rule editor is hidden
  only for identity **roots** (identity follow-ups branch freely — the AC/AD/BE
  machinery); first per-unit question defaults identity **on**; last remaining
  identity root's toggle is disabled in the off-direction; `answerScope` is passed
  to the prerequisite editor. `isUnitIdentityComponent` is sent on **both** create
  and edit via one shared `questionRequestFields` object.
- **`question-card.tsx`** — a secondary "Identity" badge beside the label when
  `question.isUnitIdentityComponent`.
- **`prerequisite-editor.tsx`** — new `answerScope` prop; referencable targets are
  filtered to the **same** scope.
- **`publish-sheet.tsx`** — root-only ≥1-identity publish gate: publish is disabled
  with an inline "per-collection questions but no identifying question" message
  when a per-unit question exists and no root is an identity component.

## Deviations from the plan (each justified)

1. **Inline UI strings, not named constants** (plan asked for constants) — per
   standing direction and the Step 2 precedent. All copy surfaces **"collection"**
   (never "unit"); **"collection batch"** is intended, confirmed terminology.
2. **`isUnitIdentityComponent` sent on edit too**, via a shared
   `questionRequestFields` base spread into the create body with the creation-only
   fields (`parentId` / `answerScope` / `order`). This dedupes the two request
   bodies **and** makes the root identity toggle persist on edit (user story 8).
3. **Publish gate checks roots only** (`draftForm.questions.some(...)`), not a full
   tree walk. A question tree is single-scope (a follow-up inherits its root's
   scope), so a root's scope covers its whole subtree — same result, no traversal,
   no `walkQuestions` import.
4. **No inline comments / no `// see ADR 0002` markers.** Per explicit direction,
   code is kept self-explanatory rather than commented. This is a **convention
   shift**: it contradicts the code→ADR-marker guidance in ADR 0002's "Applies to"
   section and prior steps (see Downstream).
5. **No util extracted.** The plan floated `draftHasUnitQuestionsButNoIdentity(draft)`
   "if reused across the sheet and publish gate"; it is used **only** in the publish
   gate (the sheet uses `identityRootQuestions.length === 0` for the first-unit
   default and `otherIdentityRootCount === 0` for the backstop — related but
   distinct predicates), so it stays inline (single consumer).

## Downstream impact & how to address it

- **Identity-toggle cascade gap (decision needed; carry into Step 4 or a
  follow-up).** Inheritance is applied at **create** time — a follow-up is sent its
  parent's identity flag. Toggling an **existing** root's identity *off* after it
  already has follow-ups PUTs only the root; its follow-ups keep
  `isUnitIdentityComponent: true` in storage, which the review layer reads directly.
  The builder itself stays internally consistent (the publish gate is
  root-authoritative; the card badge reads the stored per-question flag). If this
  must be airtight: cascade the toggle to the subtree via batched `mutateAsync`
  (like reorder), bar toggling identity off on a root that has follow-ups, or have
  review derive identity from the root. **Out of Step 3's 5-file scope** — flagged
  for a decision, not silently expanded.
- **ADR 0002 "Applies to" is now stale.** It instructs readers to grep for
  `// see ADR 0002` at the identity derivation, the prerequisite filter, and the
  publish gate; under the no-comments convention those markers are intentionally
  absent. Update the ADR's "Applies to" (and the recorded ADR-conventions note) so
  the docs match the self-explanatory-code convention, or treat markers as an
  exception here.
- **Step 4 (diff & viewer)** only reads `answerScope` / `isUnitIdentityComponent`
  off the questions (both round-trip through the Step 1 contracts unchanged); it has
  no dependency on Step 3's authoring UI.

## Testing status

- `typecheck` + `lint` green (run in-session). No automated tests (no runner).
- Manual verification to be run by the reviewer on a Dynamic (non-Uganda) program:
  toggle identity on a per-collection root → Required locks on and the visibility
  editor disappears; add a follow-up → it inherits identity read-only and stays
  required with the visibility editor still available; the last identity toggle
  can't be switched off; publish is blocked with a per-collection question and no
  identity, then allowed after adding one; a prerequisite target list offers
  same-scope questions only; toggle identity on an **existing** root → reload →
  it persists.
- First unit-test targets once a runner lands: the root-only ≥1-identity publish
  predicate and the same-scope prerequisite target filter (both pure,
  side-effect-free).
