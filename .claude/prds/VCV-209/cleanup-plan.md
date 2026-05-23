# VCV-209 — Form Builder Cleanup Plan

Companion to [VCV-209-form-builder.md](VCV-209-form-builder.md) and
[implementation-plan.md](implementation-plan.md). The original plan answered
*what* and *how to build*; this document answers *how to tidy what was built*
without changing what it does.

The cleanup ships on branch `VCV-209` in independently mergeable phases,
ordered small → large blast radius. After each phase: `npx tsc --noEmit` +
`npx eslint` on the changed paths. Manual smoke against the documented PRD
use cases after phases 2, 4, 6, 7, and 8.

---

## Goal

Bring the form-builder feature into a consistent, readable state without
changing any functionality or UI. The bar:

- Every file reads consistently with its siblings (style, imports, naming).
- Every identifier conveys what it holds without consulting the type.
- No duplicated logic, no unreachable branches, no intermediate names that
  exist only to be referenced once.
- Lines of code drop wherever redundancy is real; no abstraction is
  introduced for a single consumer.
- No behavior change visible to the user or to any external caller.

## Non-goals

- No backend, contract, BFF route, server function, or hook-layer changes.
  `src/api/form/` and `src/api/form-question/` are not touched.
- No new features, no UX changes, no copy changes.
- No shared `<PageShell>` abstraction. The three shells stay separate until
  a second feature outside the builder needs one.
- No flattening of the per-noun sub-subfolders under each subfeature's
  `components/`. The nested structure is retained.
- No automated tests added. v1 has no test runner; manual exercise remains
  the verification path.
- No codebase-wide `fetchXxx` hardening. Deferred to its own commit.

---

## Architectural fit

The cleanup preserves the three-layer architecture intact:

- **Backend Resource Layer** — untouched. `src/api/form/`,
  `src/api/form-question/`, contracts, server functions, hooks all stay
  where they are.
- **Routing Layer** — untouched. The three `src/app/(home)/forms/*/page.tsx`
  route entries and the BFF route tree under
  `src/app/api/programs/[programId]/forms/` are not moved.
- **Feature Layer** — internally tidied. Public surface (the three
  page-client default exports consumed by the route entries) stays at the
  same import paths.

Data flow remains: client component → TanStack hook → BFF route → server
function → upstream. `Result<T, NetworkError>` envelope unchanged.
`safeApiCall` and `withAuthSession` plumbing unchanged.

---

## Resolved decisions

The cleanup plan reflects three decisions taken during planning:

### Page-clients: extract a shared `ProgramGate`

The original cleanup sketch proposed keeping the three page-clients
self-contained. Rejected after re-evaluation. The three files were ~40
LOC each, differed only in skeleton, body component, and one prop, and
had drifted from each other (one used an unreachable error fallback,
brace style, and absolute imports; the other two didn't). A single
`<ProgramGate>` consolidates the `useGetUserPermissions` query, the
Uganda gate, the skeleton branch, and the error-banner branch into one
place — removing ~80 LOC and eliminating the drift surface.

### Shells: keep three, but normalize

A shared `<PageShell>` is overkill until a second feature outside the
builder needs one. The three shells stay separate. However, they
currently disagree on `max-w-3xl` vs `max-w-5xl` and on quote/semicolon
style. Phase 1 brings all three to `max-w-5xl` and identical formatting.

### Nested folder structure: retained

Each subfeature's `components/` keeps its per-noun sub-subfolders
(`editor/`, `question/`, `publish/`, `prerequisite/`, `empty-state/`,
`layout/`, `loading/`, `viewer/`, `checkout/`, `versions-list/`). The
auth feature is flat because it is small; the form-builder is large
enough that the nesting earns its keep.

### `validation/` folder: kept

The original Phase-2 item F proposed folding `draft-editor/validation/`
into `draft-editor/utils/`. Rejected: [auth/validation/](../../../src/features/auth/validation/)
is the established feature convention, so `question-form-schema.ts`
stays in `draft-editor/validation/`.

---

## Phase 1 — Inconsistencies & noise (zero behavior change) ✅ done

Smallest blast radius. Removes drift that hides real signal.

1. **Drop unreachable `?? { kind: 'unknown' }` fallback** in
   [form-versions-list-page-client.tsx](../../../src/features/form-builder/form-versions-list/components/form-versions-list-page-client.tsx)
   and
   [previous-versions-section.tsx](../../../src/features/form-builder/form-versions-list/components/versions-list/previous-versions-section.tsx).
   Both branches already guarantee `!result.ok`, so `result.error` is
   the typed `NetworkError`. Also brace the `if/return` blocks in the
   page-client so it reads identically to its two siblings. (Imports
   are *not* normalized to relative — see phase 9; the codebase
   direction is absolute.) The file is renamed
   `form-versions-page-client.tsx` → `form-versions-list-page-client.tsx`
   and the component to `FormVersionsListPageClient` to match the
   subfeature folder name; the route entry at
   [src/app/(home)/forms/page.tsx](../../../src/app/(home)/forms/page.tsx)
   is updated.
2. **Normalize the three shells** to identical formatting and `max-w-5xl`:
   - [draft-editor-shell.tsx](../../../src/features/form-builder/draft-editor/components/layout/draft-editor-shell.tsx) — `max-w-3xl` → `max-w-5xl`.
   - [form-versions-page-shell.tsx](../../../src/features/form-builder/form-versions-list/components/layout/form-versions-page-shell.tsx) — `max-w-3xl` → `max-w-5xl`.
   - [historical-viewer-shell.tsx](../../../src/features/form-builder/historical-viewer/components/layout/historical-viewer-shell.tsx) — single quotes, trailing semicolons, layout class string aligned with siblings.
3. **Standardize `<Fragment>` over `<>`** — change the two `<>` in
   [diff-question-pair.tsx](../../../src/features/form-builder/components/diff/diff-question-pair.tsx)
   to `<Fragment>`.
4. **Drop the `DRAFT_VERSION_TOKEN` constants** in
   [publish-sheet.tsx](../../../src/features/form-builder/draft-editor/components/publish/publish-sheet.tsx)
   and
   [previous-versions-section.tsx](../../../src/features/form-builder/form-versions-list/components/versions-list/previous-versions-section.tsx).
   Inline `''` at the one call site — the constant name is no clearer
   than the literal.
5. **Component name = filename:** `NoQuestionsEmptyFormState` →
   `NoQuestionsEmptyState` in
   [no-questions-empty-state.tsx](../../../src/features/form-builder/draft-editor/components/empty-state/no-questions-empty-state.tsx)
   and the one import in
   [question-list.tsx](../../../src/features/form-builder/draft-editor/components/question/question-list.tsx).

**Verify:** `npx tsc --noEmit && npx eslint src/features/form-builder` — both clean.

---

## Phase 2 — Extract `ProgramGate` ✅ done

Removes ~80 LOC of duplication across the three page-clients and
eliminates the drift surface.

1. **New file:** `src/features/form-builder/components/program-gate.tsx`.
   - Props: `skeleton: ReactNode`, `children: (programId: number) => ReactNode`.
   - Owns the `useGetUserPermissions` query, the loading branch, the
     error-banner branch, and the Uganda-program legacy gate.
   - Keeps the `UGANDA_PROGRAM_ID = 1` constant and the legacy `TODO`
     comment in one place instead of three.
2. **Rewrite the three page-clients** to thin wrappers (~10 LOC each):
   ```tsx
   export default function DraftEditorPageClient() {
       return (
           <ProgramGate skeleton={<DraftEditorSkeleton />}>
               {(programId) => <DraftEditor programId={programId} />}
           </ProgramGate>
       );
   }
   ```
3. **No UI change.** Identical render output: same skeleton during
   permissions fetch, same error banner with the same
   "We couldn't load your permissions" title, same Uganda fallback.

**Verify:** `tsc --noEmit` + smoke-test the three routes; toggle the
Uganda const to confirm the legacy gate still fires.

---

## Phase 3 — Variable & helper renames

All pure identifier swaps. TypeScript catches drift.

- [question-card.tsx:60](../../../src/features/form-builder/draft-editor/components/question/question-card.tsx#L60)
  `move(direction)` → `swapWithSibling(direction)`.
- [question-order.ts:4](../../../src/features/form-builder/draft-editor/utils/question-order.ts#L4)
  `nextOrderFor(draft)` → `nextQuestionOrder(draft)`.
- [question-order.ts:18](../../../src/features/form-builder/draft-editor/utils/question-order.ts#L18)
  `findSiblingsContainingQuestion` → `findSiblings`.
- [question-dependencies.ts:5](../../../src/features/form-builder/draft-editor/utils/question-dependencies.ts#L5)
  `prerequisiteExpressionReferencesQuestion` → `referencesQuestion`.
- [question-dependencies.ts:32](../../../src/features/form-builder/draft-editor/utils/question-dependencies.ts#L32)
  `findDependentQuestions` → `findDependents` (matches
  implementation-plan.md commit 6's naming).
- [question-form.tsx:69-75](../../../src/features/form-builder/draft-editor/components/question/question-form.tsx#L69-L75)
  `isCreateQuestionInDraftFormPending` → `isCreating`,
  `isUpdateQuestionInDraftFormPending` → `isSaving`. After phase 4
  these collapse into `isSubmitting` anyway; rename first for review.
- [publish-sheet.tsx:106](../../../src/features/form-builder/draft-editor/components/publish/publish-sheet.tsx#L106)
  `publish()` → `confirmPublish()` to match the "verb + noun" pattern
  used in `confirmDelete`, `confirmCheckout`.
- [historical-viewer.tsx:25-28](../../../src/features/form-builder/historical-viewer/components/viewer/historical-viewer.tsx#L25-L28)
  `getViewedFormResult` → `getFormByVersionResult` (matches the hook
  name `useGetProgramFormByVersion`).

---

## Phase 4 — Consolidate `question-form.tsx` CRUD

[question-form.tsx](../../../src/features/form-builder/draft-editor/components/question/question-form.tsx)
has two near-identical `mutate()` blocks (lines 108-141 and 143-174)
with duplicated toast handlers and one differing error/success message.

1. **Delete** the local `QUESTION_TYPE_OPTIONS` (lines 42-49). Drive
   the `<Select>` from `Object.entries(QUESTION_TYPE_LABELS)`. The
   shared mapping holds the same labels; the local array is dead
   duplication.
2. **Collapse** the create/update branches:
   ```tsx
   const isEditing = questionBeingEdited !== null;
   const successMessage = isEditing ? 'Question saved' : 'Question added';
   const errorTitle = isEditing
       ? "Couldn't save the question"
       : "Couldn't add the question";
   ```
   The variable shapes for the two `mutate()` calls differ (update
   takes `questionId`, create takes `parentId` and `order`), so the
   submit handler keeps a single `if (isEditing) ... else ...` for
   the variables but a single shared `handleResult(result)` local for
   the toast callbacks.
3. **Outer `<Fragment>`** (lines 178/334) wraps two children (`<div>` +
   `<SheetFooter>`), so it stays.

Estimated savings: ~40-50 LOC.

---

## Phase 5 — Extract `walk-questions.ts`

The recursive "walk every question" pattern appears in five places:

- [question-order.ts:7-10](../../../src/features/form-builder/draft-editor/utils/question-order.ts#L7-L10)
  (`visitQuestion`)
- [question-dependencies.ts:35-45](../../../src/features/form-builder/draft-editor/utils/question-dependencies.ts#L35-L45)
  (`visitQuestion`)
- [prerequisite.ts:123-137](../../../src/features/form-builder/utils/prerequisite.ts#L123-L137)
  (`findQuestionById`)
- [prerequisite-editor.tsx:63-69](../../../src/features/form-builder/draft-editor/components/prerequisite/prerequisite-editor.tsx#L63-L69)
  (`visitQuestion`)
- [form-version-diff.ts:209-218](../../../src/features/form-builder/utils/form-version-diff.ts#L209-L218)
  (`indexQuestionsById`)

This is real reuse (five consumers across four files), not premature
abstraction. The original implementation plan called for a
`flatten-questions.ts` that was never built.

1. **New util** `src/features/form-builder/utils/walk-questions.ts`:
   ```ts
   export function walkQuestions(
       questions: FormQuestion[] | undefined,
       visit: (question: FormQuestion) => void,
   ): void
   ```
2. **Rewrite** the five visitors. Each becomes 2-3 lines instead of 5-10.

Estimated savings: ~20-30 LOC.

---

## Phase 6 — `prerequisite-editor.tsx` & `prerequisite-predicate-row.tsx` readability

After phase 5,
[prerequisite-editor.tsx](../../../src/features/form-builder/draft-editor/components/prerequisite/prerequisite-editor.tsx)
shortens. Remaining cleanups:

1. **`canAddMorePredicates`** (lines 72-83) and the for-loop inside
   `addPredicate` (lines 94-117) compute the same "find a question
   with at least one unused operator" twice with subtly different
   early-exit. Extract a `pickQuestionWithFreeOperator()` helper that
   returns `{question, operator} | null`; let `addPredicate`
   short-circuit on it. `canAddMorePredicates` becomes
   `pickQuestionWithFreeOperator() !== null`.
2. **`changeReferencedQuestion`, `changeOperator`,
   `changePredicateValue`** in
   [prerequisite-predicate-row.tsx:80-124](../../../src/features/form-builder/draft-editor/components/prerequisite/prerequisite-predicate-row.tsx#L80-L124):
   three callbacks that all build a new predicate. Extract a single
   `applyChange(partial: Partial<PrerequisitePredicate>)` helper that
   handles `getDefaultValueForPredicate` re-derivation in one place.

Estimated savings: ~30-40 LOC across the two files.

---

## Phase 7 — `publish-sheet.tsx` readability

[publish-sheet.tsx](../../../src/features/form-builder/draft-editor/components/publish/publish-sheet.tsx)
(276 LOC) has a 25-LOC inline diff skeleton (lines 158-178) and a deep
ternary chain over
`isGetCurrentPublishedFormPending → hasUnexpectedCurrentFormError → isFirstPublish → diff`.

1. **Extract** the inline skeleton block into a same-file
   `PublishDiffSkeleton` function. Same-file because the skeleton is
   publish-specific; promoting to `draft-editor/components/loading/`
   would force a name that hides the relationship.
2. **Replace the ternary chain** with an early-return helper or a small
   `renderDiffPanel()` function. The current expression is hard to
   scan because each branch is multi-line.
3. **Simplify the unreachable error check** —
   `hasUnexpectedCurrentFormError && getCurrentPublishedFormResult && !getCurrentPublishedFormResult.ok`
   (lines 179-181) restates conditions already proven by
   `hasUnexpectedCurrentFormError`. The intermediate booleans
   `isFirstPublish` and `hasUnexpectedCurrentFormError` are computed
   once and used once — inline them into the render path.

Estimated savings: ~40-50 LOC.

---

## Phase 8 — `form-version-diff.ts` slimming

[form-version-diff.ts](../../../src/features/form-builder/utils/form-version-diff.ts)
is 501 LOC. After phase 5's `walkQuestions`, `indexQuestionsById`
becomes a one-liner. Remaining:

1. **Hoist** `buildAddedSubtree` and `buildRemovedSubtree` out of
   `diffFormVersions`. They only need `toQuestionsById` and the
   `diffSummary` accumulator — pass those as parameters. The
   closure-over-state is the only reason they're nested.
2. **Shorten local names.** `fromQuestionsAtThisLevel` →
   `fromQuestions`, `toQuestionsInOrder` → `sortedToQuestions`,
   `matchedFromByToQuestion` → `matchedFrom`. The "at this level" /
   "in order" prefixes are noise — the function scope already implies
   them.
3. **Collapse `arePrerequisitesEquivalent`** (3-line null-guard
   wrapper, lines 408-422) into
   `arePrerequisiteExpressionsEquivalent` with a `null` short-circuit
   at the top.
4. **The similarity-pair loop** (lines 106-153, ~50 LOC) is correct
   but does an O(n×m) scan inside a `while` that splices arrays. Any
   algorithmic change requires fixture comparison; the safer cleanup
   is rename-only for clarity and leave the algorithm.

**Functionality preservation:** the diff util is a pure function over
the `Form` type. Build three fixture pairs by hand (an added question,
a modified question, a reparented question) and compare the
`QuestionDiff` output before and after. Each fixture is a one-time
inline snippet; no test infrastructure is added. If any fixture
diverges, revert.

Estimated savings: ~60-90 LOC.

---

## Phase 9 — Absolute imports across the feature (final step)

The codebase preference is `@/...` everywhere. The form-builder
feature currently has ~40 relative imports (`../`, `../../`,
`../../../`) mixed with absolute ones; the goal is zero relative
crossings of a folder boundary inside the feature. Run last so all
earlier phases (which add and rename files) don't churn the same
import lines twice.

1. **Audit** with
   `grep -rn "from '\.\." src/features/form-builder` and convert each
   hit to its `@/features/form-builder/...` equivalent.
2. **Keep `./` imports** for true same-folder siblings (e.g.
   [form-versions-list.tsx:1-3](../../../src/features/form-builder/form-versions-list/components/versions-list/form-versions-list.tsx#L1-L3)
   importing from sibling files in the same `versions-list/` folder).
3. **No content changes** beyond import strings. TypeScript catches
   mistyped paths immediately.
4. **Optionally extend** the same audit to the rest of `src/` (~13
   additional files outside `form-builder` have relative imports);
   scope this depending on appetite — the feature-only pass is the
   minimum.

**Functionality preservation:** import-path changes are resolved at
build time. `tsc --noEmit` is sufficient to verify correctness;
runtime behavior is unaffected.

**Verify:** `npx tsc --noEmit && npx eslint src/features/form-builder`.

Estimated extent: ~40 import lines rewritten, 0 LOC delta.

---

## Skipped from the original plan

- **Item F (drop `validation/`)** — keep.
  [auth/validation/](../../../src/features/auth/validation/) is the
  established feature convention.
- **Item G (skeleton dedupe across subfeatures)** — the three skeletons
  are already different enough that they each match their respective
  layouts. The publish-sheet inline skeleton is the only real
  duplication, handled in phase 7.
- **Item I (reorder `try/catch`)** — defer.
  [question-card.tsx:90](../../../src/features/form-builder/draft-editor/components/question/question-card.tsx#L90)'s
  catch is defensive against `await response.json()` rejection on
  non-JSON responses. Address as part of the codebase-wide `fetchXxx`
  hardening.

---

## Functionality preservation strategy

The cleanup is a refactor, not a rewrite. The strategy:

1. **TypeScript as the first verification gate.** After every file
   change, `npx tsc --noEmit` must pass before the next change. The
   contract types (`Form`, `FormQuestion`, `PrerequisiteExpression`)
   are unchanged, so any incompatible refactor surfaces immediately at
   the type boundary.
2. **No contract changes.** Zod schemas, exported types, BFF response
   shapes, server-function signatures, and TanStack hook signatures
   are not touched.
3. **No hook-signature changes.** TanStack Query hook arguments and
   return shapes are not modified.
4. **No copy changes.** Toast strings, button labels, page
   descriptions, placeholders, and empty-state copy are preserved
   verbatim.
5. **No URL or route changes.** App router pages and BFF routes stay
   at the same paths.
6. **Manual exercise after each phase.** Status.md's verification
   checklist is the acceptance criterion.

For phase 8 (diff util slimming), the additional safeguard is the
per-fixture comparison of `diffFormVersions` output before and after.

---

## Extent of changes

| Layer | Files touched | Behavior change |
|---|---|---|
| Backend resource layer (`src/api/form/`, `src/api/form-question/`) | 0 | None |
| BFF routes (`src/app/api/programs/[programId]/forms/`) | 0 | None |
| App router pages (`src/app/(home)/forms/`) | 0 | None |
| Feature layer (`src/features/form-builder/`) | ~30 | None |
| **Total** | **~30** | **None** |

### Line-count expectations

| Phase | Estimated LOC reduction |
|---|---|
| 1 — inconsistencies | ~15 |
| 2 — ProgramGate | ~80 |
| 3 — renames | 0 net |
| 4 — question-form CRUD | ~40–50 |
| 5 — walkQuestions util | ~20–30 |
| 6 — prerequisite editors | ~30–40 |
| 7 — publish-sheet | ~40–50 |
| 8 — form-version-diff | ~60–90 |
| 9 — absolute imports | 0 net |
| **Total estimated reduction** | **~290–360** |

---

## Sequencing

Phases are independently mergeable and ordered small → large blast
radius. After each phase:

```
npx tsc --noEmit
npx eslint <changed paths>
yarn format
```

After phases 2, 4, 6, 7, 8: manual exercise against
`Default Surveillance Form v1.0.6` per status.md commit-12 checklist.

---

## Verification

After each phase: `tsc --noEmit` + `eslint` clean on the changed paths.

Plus the full PRD use-case exercise as a final gate:

- Versions list renders current / draft / previous in documented order.
- Uganda-program empty state appears for `programId === 1`.
- Question CRUD (add, edit, delete, reorder, follow-up) saves
  automatically and surfaces toasts on failure.
- Delete on a depended-on question is blocked with the dependent list.
- Prerequisite editor restricts operators by referenced question type
  and renders the live preview sentence.
- Question with `not` or nested-group prereq renders view-only.
- Historical viewer's diff renders added / removed / modified /
  unchanged / reparented correctly.
- Publish sheet's diff renders against current published. Already-used
  version name blocks publish. On success: toast + redirect to
  `/forms` + new version appears as current.

---

## Out of scope

- Backend changes, contract changes, BFF route changes, hook signature
  changes.
- New features, copy changes, URL changes.
- Cross-subfeature shared `<PageShell>` (deferred until a second
  shell-needing feature lands).
- Flattening sub-subfolder nesting under each subfeature's
  `components/`.
- Codebase-wide `fetchXxx` hardening.
- Automated tests, test infrastructure, or test scaffolding.
- Convention-document updates beyond this file.
