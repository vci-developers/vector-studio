# VCV-209 — Form Builder Cleanup Plan

Companion to [VCV-209-form-builder.md](VCV-209-form-builder.md) and
[implementation-plan.md](implementation-plan.md). The original plan answered
_what_ and _how to build_; this document answers _how to tidy what was built_
without changing what it does.

The cleanup ships on branch `VCV-209` in independently mergeable phases, ordered
small → large blast radius. After each phase: `npx tsc --noEmit` + `npx eslint`
on the changed paths. Manual smoke against the documented PRD use cases after
phases 2, 4, 6, 7, and 8.

---

## Goal

Bring the form-builder feature into a consistent, readable state without
changing any functionality or UI. The bar:

- Every file reads consistently with its siblings (style, imports, naming).
- Every identifier conveys what it holds without consulting the type.
- No duplicated logic, no unreachable branches, no intermediate names that exist
  only to be referenced once.
- Lines of code drop wherever redundancy is real; no abstraction is introduced
  for a single consumer.
- No behavior change visible to the user or to any external caller.

## Non-goals

- No backend, contract, BFF route, server function, or hook-layer changes.
  `src/api/form/` and `src/api/form-question/` are not touched.
- No new features, no UX changes, no copy changes.
- No shared `<PageShell>` abstraction. The three shells stay separate until a
  second feature outside the builder needs one.
- No flattening of the per-noun sub-subfolders under each subfeature's
  `components/`. The nested structure is retained.
- No automated tests added. v1 has no test runner; manual exercise remains the
  verification path.
- No codebase-wide `fetchXxx` hardening. Deferred to its own commit.

---

## Architectural fit

The cleanup preserves the three-layer architecture intact:

- **Backend Resource Layer** — untouched. `src/api/form/`,
  `src/api/form-question/`, contracts, server functions, hooks all stay where
  they are.
- **Routing Layer** — untouched. The three `src/app/(home)/forms/*/page.tsx`
  route entries and the BFF route tree under
  `src/app/api/programs/[programId]/forms/` are not moved.
- **Feature Layer** — internally tidied. Public surface (the three page-client
  default exports consumed by the route entries) stays at the same import paths.

Data flow remains: client component → TanStack hook → BFF route → server
function → upstream. `Result<T, NetworkError>` envelope unchanged. `safeApiCall`
and `withAuthSession` plumbing unchanged.

---

## Resolved decisions

The cleanup plan reflects three decisions taken during planning:

### Page-clients: extract a shared `ProgramGate`

The original cleanup sketch proposed keeping the three page-clients
self-contained. Rejected after re-evaluation. The three files were ~40 LOC each,
differed only in skeleton, body component, and one prop, and had drifted from
each other (one used an unreachable error fallback, brace style, and absolute
imports; the other two didn't). A single `<ProgramGate>` consolidates the
`useGetUserPermissions` query, the Uganda gate, the skeleton branch, and the
error-banner branch into one place — removing ~80 LOC and eliminating the drift
surface.

### Shells: keep three, but normalize

A shared `<PageShell>` is overkill until a second feature outside the builder
needs one. The three shells stay separate. However, they currently disagree on
`max-w-3xl` vs `max-w-5xl` and on quote/semicolon style. Phase 1 brings all
three to `max-w-5xl` and identical formatting.

### Nested folder structure: retained

Each subfeature's `components/` keeps its per-noun sub-subfolders (`editor/`,
`question/`, `publish/`, `prerequisite/`, `empty-state/`, `layout/`, `loading/`,
`viewer/`, `checkout/`, `versions-list/`). The auth feature is flat because it
is small; the form-builder is large enough that the nesting earns its keep.

### `validation/` folder: kept

The original Phase-2 item F proposed folding `draft-editor/validation/` into
`draft-editor/utils/`. Rejected:
[auth/validation/](../../../src/features/auth/validation/) is the established
feature convention, so `question-form-schema.ts` stays in
`draft-editor/validation/`.

---

## Phase 1 — Inconsistencies & noise (zero behavior change) ✅ done

Smallest blast radius. Removes drift that hides real signal.

1. **Drop unreachable `?? { kind: 'unknown' }` fallback** in
   [form-versions-list-page-client.tsx](../../../src/features/form-builder/form-versions-list/components/form-versions-list-page-client.tsx)
   and
   [previous-versions-section.tsx](../../../src/features/form-builder/form-versions-list/components/versions-list/previous-versions-section.tsx).
   Both branches already guarantee `!result.ok`, so `result.error` is the typed
   `NetworkError`. Also brace the `if/return` blocks in the page-client so it
   reads identically to its two siblings. (Imports are _not_ normalized to
   relative — see phase 9; the codebase direction is absolute.) The file is
   renamed `form-versions-page-client.tsx` →
   `form-versions-list-page-client.tsx` and the component to
   `FormVersionsListPageClient` to match the subfeature folder name; the route
   entry at
   [src/app/(home)/forms/page.tsx](<../../../src/app/(home)/forms/page.tsx>) is
   updated.
2. **Normalize the three shells** to identical formatting and `max-w-5xl`:
    - [draft-editor-shell.tsx](../../../src/features/form-builder/draft-editor/components/layout/draft-editor-shell.tsx)
      — `max-w-3xl` → `max-w-5xl`.
    - [form-versions-page-shell.tsx](../../../src/features/form-builder/form-versions-list/components/layout/form-versions-page-shell.tsx)
      — `max-w-3xl` → `max-w-5xl`.
    - [historical-viewer-shell.tsx](../../../src/features/form-builder/historical-viewer/components/layout/historical-viewer-shell.tsx)
      — single quotes, trailing semicolons, layout class string aligned with
      siblings.
3. **Standardize `<Fragment>` over `<>`** — change the two `<>` in
   [diff-question-pair.tsx](../../../src/features/form-builder/components/diff/diff-question-pair.tsx)
   to `<Fragment>`.
4. **Drop the `DRAFT_VERSION_TOKEN` constants** in
   [publish-sheet.tsx](../../../src/features/form-builder/draft-editor/components/publish/publish-sheet.tsx)
   and
   [previous-versions-section.tsx](../../../src/features/form-builder/form-versions-list/components/versions-list/previous-versions-section.tsx).
   Inline `''` at the one call site — the constant name is no clearer than the
   literal.
5. **Component name = filename:** `NoQuestionsEmptyFormState` →
   `NoQuestionsEmptyState` in
   [no-questions-empty-state.tsx](../../../src/features/form-builder/draft-editor/components/empty-state/no-questions-empty-state.tsx)
   and the one import in
   [question-list.tsx](../../../src/features/form-builder/draft-editor/components/question/question-list.tsx).

**Verify:** `npx tsc --noEmit && npx eslint src/features/form-builder` — both
clean.

---

## Phase 2 — Extract `ProgramGate` ✅ done

Removes ~80 LOC of duplication across the three page-clients and eliminates the
drift surface.

1. **New file:** `src/features/form-builder/components/program-gate.tsx`.
    - Props: `skeleton: ReactNode`,
      `children: (programId: number) => ReactNode`.
    - Owns the `useGetUserPermissions` query, the loading branch, the
      error-banner branch, and the Uganda-program legacy gate.
    - Keeps the `UGANDA_PROGRAM_ID = 1` constant and the legacy `TODO` comment
      in one place instead of three.
2. **Rewrite the three page-clients** to thin wrappers (~10 LOC each):
    ```tsx
    export default function DraftEditorPageClient() {
        return (
            <ProgramGate skeleton={<DraftEditorSkeleton />}>
                {programId => <DraftEditor programId={programId} />}
            </ProgramGate>
        );
    }
    ```
3. **No UI change.** Identical render output: same skeleton during permissions
   fetch, same error banner with the same "We couldn't load your permissions"
   title, same Uganda fallback.

**Verify:** `tsc --noEmit` + smoke-test the three routes; toggle the Uganda
const to confirm the legacy gate still fires.

---

## Phase 3 — Variable & helper renames ✅ done

Scoped during implementation per the rule in [[feedback-specific-identifiers]]:
don't shorten identifiers that carry load-bearing specificity, _do_ lengthen
identifiers that don't mirror their source hook or same-feature naming pattern.

**Applied:**

- [question-order.ts](../../../src/features/form-builder/draft-editor/utils/question-order.ts)
  `nextOrderFor(draft)` → `getNextQuestionOrder(draft)`.
- [question-order.ts](../../../src/features/form-builder/draft-editor/utils/question-order.ts)
  `findSiblingsContainingQuestion` → `findSiblingGroup` (with
  `candidateSiblingGroup` / `foundSiblingGroup` inside). The original name's
  "ContainingQuestion" suffix wasn't carrying signal once the function is
  understood to operate on the question tree; the new name also more accurately
  describes what's returned (the _group_ the target belongs to, including the
  target itself).
- [question-form.tsx](../../../src/features/form-builder/draft-editor/components/question/question-form.tsx)
  import and call site of `getNextQuestionOrder` updated to match.
- [publish-sheet.tsx](../../../src/features/form-builder/draft-editor/components/publish/publish-sheet.tsx)
  `publish()` → `confirmPublish()` (definition + Enter handler + button
  onClick). Matches `confirmDelete` / `confirmCheckout` pattern in the same
  feature.
- [historical-viewer.tsx](../../../src/features/form-builder/historical-viewer/components/viewer/historical-viewer.tsx)
  `getViewedFormResult` → `getProgramFormByVersionResult` and
  `getDraftFormResult` → `getDraftFormByProgramIdResult`, plus matching
  `isGet…Pending` / `refetch…` destructure aliases. Mirrors the hook names
  exactly per [[feedback-tanstack-query-conventions]].

**Rejected (long form kept):**

- `move(direction)` in question-card.tsx — `move('up')` reads naturally next to
  the up/down arrow buttons that fire it; the underlying `swapAdjacentSiblings`
  is the implementation detail, not the intent.
- `isCreateQuestionInDraftFormPending` / `isUpdateQuestionInDraftFormPending` in
  question-form.tsx — the long names connect each flag to its specific hook;
  shortening to `isCreating` / `isSaving` would drop that link.
- `findDependentQuestions` / `prerequisiteExpressionReferencesQuestion` in
  question-dependencies.ts — both names encode the returned noun and the subject
  of the predicate; shortening would strip both.

---

## Phase 4 — Consolidate `question-form.tsx` CRUD ✅ done

[question-form.tsx](../../../src/features/form-builder/draft-editor/components/question/question-form.tsx)
had two near-identical `mutate()` blocks with duplicated toast handlers and one
differing error/success message, plus a local `QUESTION_TYPE_OPTIONS` array that
duplicated the shared `QUESTION_TYPE_LABELS` mapping.

**Applied:**

1. **Dropped** the local `QUESTION_TYPE_OPTIONS`. The `<Select>` now iterates
   `Object.entries(QUESTION_TYPE_LABELS)` directly. The `FormQuestionType`
   import was the only consumer of that type in the file and was dropped with
   it.
2. **Collapsed** the create/update branches. `onSubmit` now derives `isEditing`,
   `errorTitle`, `successMessage`, and `normalizedOptions` once at the top, then
   hoists two shared callbacks (`handleMutationResult`, `handleNetworkError`)
   that close over them. The differing variable shapes (update needs
   `questionId`; create needs `parentId` and `order`) keep the
   `if (isEditing) … else` split, but each branch reuses the same two callback
   references.
3. **`handleMutationResult`** is typed `Result<unknown, NetworkError>` — wide
   enough to satisfy both `usePostQuestionToDraftForm` and
   `usePutQuestionToDraftForm` via function-parameter contravariance, and avoids
   naming an intermediate success shape that neither handler reads.
4. **Outer `<Fragment>`** kept — wraps the form `<div>` plus `<SheetFooter>`.

**Imports tightened:** added `QUESTION_TYPE_LABELS` (absolute path per
[[feedback-absolute-imports]]), `type NetworkError` alongside the existing
`networkErrorMessage` value import, and `type Result` from
`@/lib/result/result`.

**Regression caught during apply:** the first edit dropped the `return;` between
the update branch and the create call, which caused edits to fire both mutations
and create a duplicate. Spotted during the post-apply read, fixed before the doc
was updated.

Savings: ~17 LOC (8 from the dropped array, ~9 net from the collapsed mutate
blocks once shared imports are counted).

---

## Phase 5 — Extract `walk-questions.ts` ✅ done

The recursive "walk every question" pattern appeared in five places across four
files. Real reuse, not premature abstraction.

**Applied:**

1. **New util**
   [walk-questions.ts](../../../src/features/form-builder/utils/walk-questions.ts)
   — 10 lines including the import. Pre-order traversal, parent before children,
   `undefined` handled at both top level and `subQuestions`:
    ```ts
    export function walkQuestions(
        questions: FormQuestion[] | undefined,
        visit: (question: FormQuestion) => void,
    ): void;
    ```
2. **Five consumers rewritten:**
    - [question-order.ts](../../../src/features/form-builder/draft-editor/utils/question-order.ts)
      — `getNextQuestionOrder` collapsed to a single `walkQuestions` + max-order
      accumulator. `findSiblingGroup` left alone (needs sibling-array shape, not
      per-node walk).
    - [question-dependencies.ts](../../../src/features/form-builder/draft-editor/utils/question-dependencies.ts)
      — `findDependentQuestions` collapsed to walk + push-on-match.
    - [prerequisite.ts](../../../src/features/form-builder/utils/prerequisite.ts)
      — `findQuestionById` rewritten as walk + captured variable. Loses
      early-exit, but IDs are unique so the returned node is identical;
      full-walk cost is negligible at form sizes.
    - [prerequisite-editor.tsx](../../../src/features/form-builder/draft-editor/components/prerequisite/prerequisite-editor.tsx)
      — referencable-questions collection collapsed to walk + filter-by-id.
    - [form-version-diff.ts](../../../src/features/form-builder/utils/form-version-diff.ts)
      — `indexQuestionsById` **deleted entirely** (one step beyond the plan as
      originally written). With `walkQuestions` it became a one-liner; the
      wrapper had nothing left to do. Both call sites in `diffFormVersions` now
      use `walkQuestions` inline.

**Import-path consistency note:** the two `draft-editor/utils/` files imported
`walkQuestions` via relative `../../utils/walk-questions`, matching their
existing relative-import style. Phase 9 will normalize the feature to absolute
`@/...` in one sweep.

**Regression caught during apply:** the inserted `walkQuestions` block in
`prerequisite-editor.tsx` was missing trailing semicolons on the
`push(question)` statement and the `})` closer — every other statement in the
file is semicolon-terminated. ESLint did not flag it; spotted during the
post-apply read and fixed before the doc was updated.

Savings: ~25 LOC across the five consumers plus the deleted `indexQuestionsById`
wrapper.

---

## Phase 6 — `prerequisite-editor.tsx` & `prerequisite-predicate-row.tsx` readability ✅ done

**Applied to
[prerequisite-editor.tsx](../../../src/features/form-builder/draft-editor/components/prerequisite/prerequisite-editor.tsx):**

1. **Extracted `findFirstAvailablePredicate()`** — returns
   `{ question, operator } | null` (inlined return shape, no named alias).
   Replaces the duplicated for-loop that previously appeared in both
   `canAddMorePredicates` (as `.some(...)`) and `addPredicate`.
   `canAddMorePredicates` is now a single-line non-null check; the name mirrors
   the in-file `firstAvailableOperator` / `availableOperators` vocabulary.
2. **Inlined `emitExpressionChange` at all four call sites** — `addPredicate`,
   `updatePredicateAt`, `removePredicateAt`, and the connector `<Select>`'s
   `onValueChange`. The wrapper was pure composition (`buildPrerequisite` →
   `onPrerequisiteExpressionChange`) and added a "what does this name do?" hop
   without abstracting real logic. `updatePredicateAt` and `removePredicateAt`
   stay named — each contains real array manipulation (slice+assign, filter),
   not a thin wrapper.

**Applied to
[prerequisite-predicate-row.tsx](../../../src/features/form-builder/draft-editor/components/prerequisite/prerequisite-predicate-row.tsx):**

1. **Extracted `revisePredicate(partial)`** — single helper that absorbs the
   value-rederivation rule. The `'value' in partial` key-presence check is
   load-bearing (it distinguishes "caller didn't pass value" from "caller passed
   `value: undefined`", which matters because `empty` / `not_empty` operators
   legitimately produce `value: undefined`). Naming chosen for the verb's
   "partial change" connotation, plain English over jargon like `patch`, and to
   read distinctly from the `onPredicateChange` prop it calls.
2. **Kept `changeReferencedQuestion`** — has real multi-step logic (find next
   question → fetch used operators → pick first available → emit) worth naming.
3. **Inlined `changeOperator` and `changePredicateValue` at their JSX call
   sites** — both were one-line passthroughs to `revisePredicate({ ... })` whose
   names added nothing beyond what the inlined call shows. The original
   `if (!referencedQuestion) return;` guard in `changeOperator` folds correctly
   into `revisePredicate`'s `if (!nextQuestion) return;`.

**Principle reinforced during this phase:** prefer fewer utilities over fewer
lines. A thin wrapper that only renames an existing composition (e.g.
`emitExpressionChange`, `changeOperator`, `changePredicateValue`) costs the
reader a name lookup without hiding real complexity, so it loses to the inlined
call. Helpers earn their keep when they consolidate non-trivial logic
(`findFirstAvailablePredicate`, `revisePredicate`, `changeReferencedQuestion`)
or non-trivial state shaping (`updatePredicateAt`, `removePredicateAt`).

**Regressions caught during apply:**

- `availablPredicate` typo (missing `e`) at five sites in `addPredicate` —
  spotted on read-back, fixed before the `emitExpressionChange` inlining
  proceeded.
- `changeOperator` / `changePredicateValue` deleted from the row component
  without inlining their JSX call sites, leaving two `TS2304: Cannot find name`
  errors. Caught by `tsc --noEmit`, fixed by inlining the two arrows.

Savings: ~25 LOC across the two files; net handler count drops from four
(editor) + three (row) to three + two, with the remaining ones each carrying
real logic.

---

## Phase 7 — `publish-sheet.tsx` readability ✅ done

Three of the four original prescriptions were adjusted during execution. The
skeleton moved to `loading/` (not same-file), no render helper was extracted
(per the "everything inline / no render functions that return JSX" rule), and
`hasUnexpectedCurrentFormError` stayed as a boolean rather than becoming a typed
value.

**Applied:**

1. **Extracted `PublishDiffSkeleton` to its own file** at
   [draft-editor/components/loading/publish-diff-skeleton.tsx](../../../src/features/form-builder/draft-editor/components/loading/publish-diff-skeleton.tsx)
   — not same-file as originally planned. The `loading/` folder is the
   established home for skeletons across all three subfeatures
   ([draft-editor-skeleton.tsx](../../../src/features/form-builder/draft-editor/components/loading/draft-editor-skeleton.tsx),
   [form-versions-list-skeleton.tsx](../../../src/features/form-builder/form-versions-list/components/loading/form-versions-list-skeleton.tsx),
   [historical-viewer-skeleton.tsx](../../../src/features/form-builder/historical-viewer/components/loading/historical-viewer-skeleton.tsx)),
   so promoting the publish skeleton there reads more consistently than keeping
   it inline. The publish-specific name keeps the relationship clear without
   needing co-location.
2. **Kept the inline ternary chain — no render helper.** The "everything
   rendered inline / no render functions that return JSX / one component per
   file" rule rejected the `renderDiffPanel()` option. The four branches stay as
   a JSX ternary at the call site.
3. **Eliminated the redundant narrowing chain by lifting
   `!getCurrentPublishedFormResult` into the loading branch.** The first branch
   now reads
   `!getCurrentPublishedFormResult || isGetCurrentPublishedFormPending`. Once
   that's false in the downstream branches, TypeScript narrows
   `getCurrentPublishedFormResult` to defined, so the error branch drops its
   redundant `getCurrentPublishedFormResult &&` truthy check. Same effect as the
   alternative `unexpectedCurrentFormError: NetworkError | null` route, without
   the extra `type NetworkError` import.
4. **Also fixed `publish-diff-skeleton.tsx` quote style and row index name** to
   match the sibling
   [draft-editor-skeleton.tsx](../../../src/features/form-builder/draft-editor/components/loading/draft-editor-skeleton.tsx)
   (single quotes; `skeletonRowIndex` → `i`). It was the only file in
   `src/features/form-builder/` using double-quoted imports.

**Rejected (kept as-is):**

- **`hasUnexpectedCurrentFormError` kept as a boolean.** The alternative was to
  convert it to `unexpectedCurrentFormError: NetworkError | null` and carry the
  typed error through. Both approaches collapse the JSX narrowing chain; the
  boolean + lifted-undefined-check route was shorter to apply.
- **`isFirstPublish` kept.** The original plan called it "computed once and used
  once" — that's stale. It's used twice (panel branch and the FieldDescription
  "No versions have been published yet"). Two uses earns its name.
- **No `<PublishDiffPanel>` sub-component.** Considered for
  single-responsibility separation, but the parent's footer needs
  `isFirstPublish` from the same `useGetCurrentFormByProgramId` query the panel
  would own. Extraction would force either a 6+ prop pipeline, a custom hook
  whose only job is to launder the query call, or duplicate derivation in both
  files. Inline cleanup avoided the cross-file coordination cost.

**Subtle behavior change accepted:** the new `!getCurrentPublishedFormResult ||`
in the loading branch slightly widens when the skeleton renders. In the rare
edge case where `data === undefined && isPending === false` (an underlying
`fetch` reject that TanStack catches into `isError`), the original code rendered
nothing; the new code renders the skeleton. This is exactly the "perpetually
loading on rejected fetch" state the `fetchXxx` hardening deferred-decision
flags as a real bug — showing the skeleton is arguably better UX than showing
nothing.

Savings: ~22 LOC removed from `publish-sheet.tsx` (the 25-line inline skeleton
block plus the redundant narrowing condition); +28 LOC added in the new
`publish-diff-skeleton.tsx`. Net LOC roughly flat, but the publish-sheet's diff
panel collapses to a single `<PublishDiffSkeleton />` line and the skeleton
lives with its siblings under `loading/`.

---

## Phase 8 — `form-version-diff.ts` slimming ✅ done

Three of the four plan items were rejected during execution. The actual wins
came from three reductions that weren't on the original list: pass-1 ID-matching
dead code, defensive intra-form null fallbacks, and a parallel-tracking Set that
duplicated a Map's `.values()`.

**Applied:**

1. **Removed the pass-1 ID-matching pre-pass entirely** — the loop body and the
   `console.log` probe that surfaced it. Provably dead: the backend assigns
   fresh question IDs at publish/checkout, so
   `fromQuestionsById.get(toQuestion.id)` can never hit — the two forms passed
   by every caller live in disjoint ID spaces. The Map declaration stays; the
   similarity loop is now its only writer. The [status.md](status.md) note about
   "pass 1 catches reparenting" was an artifact of a hypothetical that never
   matched actual backend behavior. Verification path: throw-probe in the dead
   branch + caller audit (both
   [publish-sheet](../../../src/features/form-builder/draft-editor/components/publish/publish-sheet.tsx)
   and
   [historical-viewer](../../../src/features/form-builder/historical-viewer/components/viewer/historical-viewer.tsx)
   always pass two different forms) + backend contract confirmation from the
   user.
2. **Cascading dead-code removals that fell out of #1:**
    - `buildRemovedSubtree`'s
      `.filter(subQuestion => !toQuestionsById.has(...))` — always-true filter,
      deleted.
    - Bottom loop's `if (toQuestionsById.has(fromQuestion.id)) continue;` —
      always-false guard, deleted.
    - `unmatchedToSiblings` / `unmatchedFromSiblings` pre-filters — collapsed to
      `[...sortedToSiblings]` / `[...sortedFromSiblings]` spread copies once the
      only thing they were filtering against (the dead Map) was gone.
    - `similarityPairedFromSiblings` Set — entirely redundant parallel
      bookkeeping for `matchedFromByToQuestion.values()`. Derived inline as
      `new Set(matchedFromByToQuestion.values())` in the bottom loop.
3. **Removed defensive intra-form null fallbacks** in `resolveParentSummary`
   (the `` ?? `Question ${parentQuestionId}` `` label fallback) and
   `areQuestionReferencesLabelEquivalent` (the
   `if (!fromRef || !toRef) return false;` guard). Both fired only on orphan
   references — `parentId` / `prerequisite.questionId` pointing at a question
   not in the same form's tree — which the UI prevents (delete is blocked on
   dependents) and the backend enforces. Replaced with `Map.get(id)!` to match
   the existing non-null-assertion style in this file (e.g.
   `unmatchedToSiblings[bestToIndex]!`). Per the project rule "Don't add error
   handling, fallbacks, or validation for scenarios that can't happen."
4. **Harmonized `paired…` → `matched…` naming** in the similarity loop and
   bottom loop (`pairedToQuestion`, `pairedFromQuestion`, `pairedFromSiblings`).
   The file already used `matched…` / `unmatched…` as antonyms throughout the
   matching infrastructure; the stray `paired…` references read as a different
   concept. Now every variable in `buildSiblingDiffs` uses one verb family.

**Rejected (plan items not applied):**

- **Item 1 (hoist `buildAddedSubtree` / `buildRemovedSubtree`).** Both close
  over `diffSummary`; hoisting trades a nested function for a parameter-threaded
  one. The closure isn't hiding anything subtle, the function bodies are ~10
  lines each, and the nesting reads naturally as "these are implementation
  details of `computeFormVersionDiff`." Net neutral; not worth the churn.
- **Item 2 (`matchedFromByToQuestion` → `matchedFrom`).** Violates
  [[feedback-specific-identifiers]] — the "ByToQuestion" suffix encodes what the
  Map is indexed by, which `matchedFrom` alone drops. The other shortenings the
  plan called for (`fromQuestionsAtThisLevel`, `toQuestionsInOrder`) didn't
  apply because the current names had already drifted past those during Phase 5.
- **Plan item 3 (collapse `arePrerequisitesEquivalent` wrapper).** No wrapper
  existed by the time this phase ran — likely consolidated during an earlier
  pass.
- **`areExpressionListsEquivalent` extraction** (considered for the `'all'` and
  `'any'` branches of `arePrerequisiteExpressionsEquivalent` — two ~10-line
  blocks differing only in `.all` vs `.any`). Rejected as overengineering per
  [[feedback-prefer-fewer-utilities]]: two side-by-side duplicate blocks in one
  function read more directly than a helper plus two call sites. The bar for
  extraction is not "this is duplicated" — it is "the reader can't easily see
  what this does at the call site." Memory updated with this calibration.

**Plan item 4 (similarity-pair loop):** algorithm left alone per the plan's
"rename-only for clarity" directive. The matched/paired harmonization (item 4
above) is the entirety of the change.

**Verification:**

- `npx tsc --noEmit` — clean.
- `npx eslint src/features/form-builder/utils/form-version-diff.ts` — clean.
- `yarn format` — applied (also fixed a double-quote import in
  [question-diff-similarity.ts](../../../src/features/form-builder/utils/question-diff-similarity.ts)
  as a side effect, the only file in `utils/` using double quotes).
- Manual smoke owed before merge: publish sheet diff (current published vs draft
  with added/modified/removed visible), historical viewer diff across two
  version comparisons including a reparented case, post-checkout revisit reads
  as all-unchanged — the key smoke for "similarity matching is now the only
  pairing mechanism."

Savings: 387 → 368 LOC (19 LOC). Below the plan's ~60–90 estimate because the
phase delivered targeted dead-code removal rather than broad algorithmic
restructuring — the algorithm and its naming were already in reasonable shape
after Phase 5.

---

## Phase 9 — Absolute imports across the feature (final step)

The codebase preference is `@/...` everywhere. The form-builder feature
currently has ~40 relative imports (`../`, `../../`, `../../../`) mixed with
absolute ones; the goal is zero relative crossings of a folder boundary inside
the feature. Run last so all earlier phases (which add and rename files) don't
churn the same import lines twice.

1. **Audit** with `grep -rn "from '\.\." src/features/form-builder` and convert
   each hit to its `@/features/form-builder/...` equivalent.
2. **Keep `./` imports** for true same-folder siblings (e.g.
   [form-versions-list.tsx:1-3](../../../src/features/form-builder/form-versions-list/components/versions-list/form-versions-list.tsx#L1-L3)
   importing from sibling files in the same `versions-list/` folder).
3. **No content changes** beyond import strings. TypeScript catches mistyped
   paths immediately.
4. **Optionally extend** the same audit to the rest of `src/` (~13 additional
   files outside `form-builder` have relative imports); scope this depending on
   appetite — the feature-only pass is the minimum.

**Functionality preservation:** import-path changes are resolved at build time.
`tsc --noEmit` is sufficient to verify correctness; runtime behavior is
unaffected.

**Verify:** `npx tsc --noEmit && npx eslint src/features/form-builder`.

Estimated extent: ~40 import lines rewritten, 0 LOC delta.

---

## Skipped from the original plan

- **Item F (drop `validation/`)** — keep.
  [auth/validation/](../../../src/features/auth/validation/) is the established
  feature convention.
- **Item G (skeleton dedupe across subfeatures)** — the three skeletons are
  already different enough that they each match their respective layouts. The
  publish-sheet inline skeleton is the only real duplication, handled in
  phase 7.
- **Item I (reorder `try/catch`)** — defer.
  [question-card.tsx:90](../../../src/features/form-builder/draft-editor/components/question/question-card.tsx#L90)'s
  catch is defensive against `await response.json()` rejection on non-JSON
  responses. Address as part of the codebase-wide `fetchXxx` hardening.

---

## Functionality preservation strategy

The cleanup is a refactor, not a rewrite. The strategy:

1. **TypeScript as the first verification gate.** After every file change,
   `npx tsc --noEmit` must pass before the next change. The contract types
   (`Form`, `FormQuestion`, `PrerequisiteExpression`) are unchanged, so any
   incompatible refactor surfaces immediately at the type boundary.
2. **No contract changes.** Zod schemas, exported types, BFF response shapes,
   server-function signatures, and TanStack hook signatures are not touched.
3. **No hook-signature changes.** TanStack Query hook arguments and return
   shapes are not modified.
4. **No copy changes.** Toast strings, button labels, page descriptions,
   placeholders, and empty-state copy are preserved verbatim.
5. **No URL or route changes.** App router pages and BFF routes stay at the same
   paths.
6. **Manual exercise after each phase.** Status.md's verification checklist is
   the acceptance criterion.

For phase 8 (diff util slimming), the additional safeguard is the per-fixture
comparison of `diffFormVersions` output before and after.

---

## Extent of changes

| Layer                                                              | Files touched | Behavior change |
| ------------------------------------------------------------------ | ------------- | --------------- |
| Backend resource layer (`src/api/form/`, `src/api/form-question/`) | 0             | None            |
| BFF routes (`src/app/api/programs/[programId]/forms/`)             | 0             | None            |
| App router pages (`src/app/(home)/forms/`)                         | 0             | None            |
| Feature layer (`src/features/form-builder/`)                       | ~30           | None            |
| **Total**                                                          | **~30**       | **None**        |

### Line-count expectations

| Phase                         | Estimated LOC reduction |
| ----------------------------- | ----------------------- |
| 1 — inconsistencies           | ~15                     |
| 2 — ProgramGate               | ~80                     |
| 3 — renames                   | 0 net                   |
| 4 — question-form CRUD        | ~40–50                  |
| 5 — walkQuestions util        | ~20–30                  |
| 6 — prerequisite editors      | ~30–40                  |
| 7 — publish-sheet             | ~40–50                  |
| 8 — form-version-diff         | ~20 (actual)            |
| 9 — absolute imports          | 0 net                   |
| **Total estimated reduction** | **~250–320**            |

---

## Sequencing

Phases are independently mergeable and ordered small → large blast radius. After
each phase:

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
- Question CRUD (add, edit, delete, reorder, follow-up) saves automatically and
  surfaces toasts on failure.
- Delete on a depended-on question is blocked with the dependent list.
- Prerequisite editor restricts operators by referenced question type and
  renders the live preview sentence.
- Question with `not` or nested-group prereq renders view-only.
- Historical viewer's diff renders added / removed / modified / unchanged /
  reparented correctly.
- Publish sheet's diff renders against current published. Already-used version
  name blocks publish. On success: toast + redirect to `/forms` + new version
  appears as current.

---

## Out of scope

- Backend changes, contract changes, BFF route changes, hook signature changes.
- New features, copy changes, URL changes.
- Cross-subfeature shared `<PageShell>` (deferred until a second shell-needing
  feature lands).
- Flattening sub-subfolder nesting under each subfeature's `components/`.
- Codebase-wide `fetchXxx` hardening.
- Automated tests, test infrastructure, or test scaffolding.
- Convention-document updates beyond this file.
