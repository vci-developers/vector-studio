# VCV-209 — Form Builder Cleanup Plan

Companion to [VCV-209-form-builder.md](VCV-209-form-builder.md) and
[implementation-plan.md](implementation-plan.md). The original plan answered
*what* and *how to build*; this document answers *how to tidy what was built*
without changing what it does.

The work ships in two phases on branch `VCV-209`:

- **Phase 1** — pure file reorganization and renames. No behavior change.
- **Phase 2** — file-by-file cleanup of the moved tree. No behavior change.

Both phases are user-driven; Claude proposes and reviews, the user applies the
moves.

---

## Goal

Reorganize the `form-builder` feature into three self-contained subfeatures
(`form-versions-list`, `draft-editor`, `historical-viewer`), with truly
shared infrastructure at the feature root, and then simplify every file in
the resulting tree. The bar is:

- Every folder reads as a single purpose.
- Every file name conveys what is inside without consulting the imports.
- Every identifier conveys what it holds without consulting the type.
- Lines of code drop wherever redundancy is real, but no abstraction is
  introduced for a single consumer.
- No behavior change visible to the user or to any external caller.

## Non-goals

- No backend, contract, BFF route, server function, or hook-layer changes.
  The `src/api/form/` and `src/api/form-question/` modules are not touched.
- No new features, no UX changes, no copy changes.
- No new abstractions (HOCs, generic wrappers, factory functions) introduced
  to collapse the three page-clients or the three shells. The user picked
  per-subfeature self-containment over cross-subfeature sharing for those.
- No automated tests added. v1 has no test runner; manual exercise remains
  the verification path.
- No `MEMORY.md` or convention-document updates beyond this file.

---

## Architectural fit

The cleanup preserves the three-layer architecture intact:

- **Backend Resource Layer** — untouched. `src/api/form/`,
  `src/api/form-question/`, contracts, server functions, hooks all stay
  where they are.
- **Routing Layer** — untouched. `src/app/(home)/forms/page.tsx`,
  `/draft/page.tsx`, `/[version]/page.tsx` and the BFF route tree under
  `src/app/api/programs/[programId]/forms/` are not moved.
- **Feature Layer** — restructured. `src/features/form-builder/` is
  internally reorganized; its public surface (the three page-client
  default exports consumed by the route entries) stays at the same import
  paths from the routes' point of view after Phase 1's import updates.

Data flow remains: client component → TanStack hook → BFF route → server
function → upstream. `Result<T, NetworkError>` envelope unchanged.
`safeApiCall` and `withAuthSession` plumbing unchanged.

---

## Key decisions

These are the resolved decisions the rest of the plan assumes.

### Three subfeatures, with shared infrastructure at the root

`form-builder/` gains three subfeature folders — `form-versions-list/`,
`draft-editor/`, `historical-viewer/` — each with its own
`components/` (and `utils/` when there is something to put there). The
feature root keeps `components/` and `utils/` folders that hold only the
infrastructure shared across multiple subfeatures.

**Decision rule:** a file lives at the root only if at least two
subfeatures import it. Everything else is moved into its single owning
subfeature.

### Page-clients and shells stay per-subfeature

The original cleanup sketch proposed collapsing the three page-clients
into a shared `<ProgramGate>` and the three shells into a shared
`<PageShell>`. Rejected during planning in favour of self-contained
subfeatures. The duplication is small (~40 LOC × 3 page-clients, ~25 LOC
× 3 shells), all three subfeatures get to evolve their own header / back-
link / description copy independently, and the per-subfeature reading
experience is cleaner with no cross-subfeature jump for the page entry.

### The diff bundle is shared infrastructure

`publish-sheet.tsx` (in `draft-editor/`) imports `DiffQuestionList` and
`DiffSummary`, which transitively pull in `DiffQuestionCard`,
`DiffFieldChangeRow`, and `DiffScalarChange`. The diff is also the
historical viewer's primary surface. Two-subfeature usage → root.

Both the rendering components and the compute logic move as a unit:

- Components: `src/features/form-builder/components/diff/` holds the
  five diff components.
- Util: `src/features/form-builder/utils/form-version-diff.ts` stays
  in the root utils.

`publish-sheet.tsx` and `historical-viewer.tsx` both import from
`components/diff/` rather than reaching across subfeature folders.

### Empty `utils/` folders are not created

The two subfeatures with no utilities (`form-versions-list/`,
`historical-viewer/`) do not get placeholder `utils/` folders. Empty
folders are not tracked by git, and a placeholder file would be the kind
of speculative scaffolding the project standards reject. The folder can
be added later if a utility ever materializes.

### Three file renames; no other renames

After consideration, exactly three filename changes pay off:

- `utils/form-question-prerequisite.ts` → `utils/prerequisite.ts`
  (the file is about prerequisites, not form-questions).
- `draft-editor/utils/form-question-order.ts` → `question-order.ts`
  (redundant `form-` prefix inside the form-builder feature).
- `draft-editor/utils/form-question-dependencies.ts` →
  `question-dependencies.ts` (same reason).

All other file names were evaluated and kept. Diff components retain
their `diff-` prefix because the components are named `DiffSummary`,
`DiffQuestionCard`, etc., and the project convention is
`filename === component-kebab`. `form-version-diff.ts` keeps its prefix
because the exported function is `diffFormVersions` over the `Form`
type. `uganda-program-empty-state.tsx` keeps its specific name on
purpose — status.md records the rejection of a generic
`legacy-program-empty-state` in favour of a name that reads as a
temporary hack.

---

## Phase 1 — file reorganization (no behavior change)

### Final layout

```
src/features/form-builder/
├── components/                              ← shared infrastructure
│   ├── diff/                                ← shared by historical-viewer + publish-sheet
│   │   ├── diff-summary.tsx
│   │   ├── diff-question-list.tsx
│   │   ├── diff-question-card.tsx
│   │   ├── diff-field-change-row.tsx
│   │   └── diff-scalar-change.tsx
│   ├── form-error-banner.tsx
│   └── uganda-program-empty-state.tsx
├── utils/                                   ← shared infrastructure
│   ├── prerequisite.ts                      (renamed from form-question-prerequisite.ts)
│   ├── form-version-diff.ts
│   └── question-type-labels.ts
├── form-versions-list/
│   └── components/
│       ├── forms-page-client.tsx
│       ├── forms-page-shell.tsx
│       ├── form-versions-list-skeleton.tsx
│       ├── form-versions-list.tsx
│       ├── form-versions-section.tsx
│       ├── current-version-section.tsx
│       ├── draft-version-section.tsx
│       ├── previous-versions-section.tsx
│       ├── no-current-form-empty-state.tsx
│       └── previous-versions-empty-state.tsx
├── draft-editor/
│   ├── components/
│   │   ├── draft-editor-page-client.tsx
│   │   ├── draft-editor-shell.tsx
│   │   ├── draft-editor-skeleton.tsx
│   │   ├── draft-editor.tsx
│   │   ├── draft-editor-header.tsx
│   │   ├── form-name-inline-edit.tsx
│   │   ├── question-list.tsx
│   │   ├── question-card.tsx
│   │   ├── question-sheet.tsx
│   │   ├── question-form.tsx
│   │   ├── options-editor.tsx
│   │   ├── delete-question-dialog.tsx
│   │   ├── publish-sheet.tsx
│   │   ├── prerequisite-editor.tsx
│   │   ├── prerequisite-predicate-row.tsx
│   │   ├── prerequisite-value-input.tsx
│   │   ├── prerequisite-complex-rule-summary.tsx
│   │   └── empty-draft-form-state.tsx
│   └── utils/
│       ├── question-order.ts                (renamed from form-question-order.ts)
│       ├── question-dependencies.ts         (renamed from form-question-dependencies.ts)
│       └── question-form-schema.ts          (moved from validation/)
└── historical-viewer/
    └── components/
        ├── historical-viewer-page-client.tsx
        ├── historical-viewer-shell.tsx
        ├── historical-viewer-skeleton.tsx
        ├── historical-viewer.tsx
        ├── historical-viewer-header.tsx
        └── checkout-confirm-dialog.tsx
```

The old top-level folders disappear:

- `components/draft-editor/` → folded into `draft-editor/components/`
- `components/form-versions-list/` → folded into
  `form-versions-list/components/`
- `components/historical-viewer/` → split into shared
  `components/diff/` + subfeature `historical-viewer/components/`
- `components/empty-state/` → split per owning subfeature
  (`uganda-program-empty-state` to root, others into their subfeatures)
- `components/error/` → folded into root `components/` (one file)
- `components/layout/` → split per owning subfeature
- `components/loading/` → split per owning subfeature
- `validation/` → folded into `draft-editor/utils/`

### File moves

Total files touched in Phase 1: **~45 files** (every file in
`src/features/form-builder/`). Of those, **3 are renamed**, the rest are
moved.

Move table (current → new), grouped by destination:

**To `form-builder/components/` (root, shared):**

| Current path | New path |
|---|---|
| `components/error/form-error-banner.tsx` | `components/form-error-banner.tsx` |
| `components/empty-state/uganda-program-empty-state.tsx` | `components/uganda-program-empty-state.tsx` |
| `components/historical-viewer/diff-summary.tsx` | `components/diff/diff-summary.tsx` |
| `components/historical-viewer/diff-question-list.tsx` | `components/diff/diff-question-list.tsx` |
| `components/historical-viewer/diff-question-card.tsx` | `components/diff/diff-question-card.tsx` |
| `components/historical-viewer/diff-field-change-row.tsx` | `components/diff/diff-field-change-row.tsx` |
| `components/historical-viewer/diff-scalar-change.tsx` | `components/diff/diff-scalar-change.tsx` |

**To `form-builder/utils/` (root, shared):**

| Current path | New path |
|---|---|
| `utils/form-question-prerequisite.ts` | `utils/prerequisite.ts` (renamed) |
| `utils/form-version-diff.ts` | `utils/form-version-diff.ts` |
| `utils/question-type-labels.ts` | `utils/question-type-labels.ts` |

**To `form-versions-list/components/`:**

| Current path | New path |
|---|---|
| `components/forms-page-client.tsx` | `form-versions-list/components/forms-page-client.tsx` |
| `components/layout/forms-page-shell.tsx` | `form-versions-list/components/forms-page-shell.tsx` |
| `components/loading/form-versions-list-skeleton.tsx` | `form-versions-list/components/form-versions-list-skeleton.tsx` |
| `components/form-versions-list/form-versions-list.tsx` | `form-versions-list/components/form-versions-list.tsx` |
| `components/form-versions-list/form-versions-section.tsx` | `form-versions-list/components/form-versions-section.tsx` |
| `components/form-versions-list/current-version-section.tsx` | `form-versions-list/components/current-version-section.tsx` |
| `components/form-versions-list/draft-version-section.tsx` | `form-versions-list/components/draft-version-section.tsx` |
| `components/form-versions-list/previous-versions-section.tsx` | `form-versions-list/components/previous-versions-section.tsx` |
| `components/empty-state/no-current-form-empty-state.tsx` | `form-versions-list/components/no-current-form-empty-state.tsx` |
| `components/empty-state/previous-versions-empty-state.tsx` | `form-versions-list/components/previous-versions-empty-state.tsx` |

**To `draft-editor/components/`:**

| Current path | New path |
|---|---|
| `components/draft-editor-page-client.tsx` | `draft-editor/components/draft-editor-page-client.tsx` |
| `components/layout/draft-editor-shell.tsx` | `draft-editor/components/draft-editor-shell.tsx` |
| `components/loading/draft-editor-skeleton.tsx` | `draft-editor/components/draft-editor-skeleton.tsx` |
| `components/draft-editor/*.tsx` (15 files) | `draft-editor/components/*.tsx` |
| `components/empty-state/empty-draft-form-state.tsx` | `draft-editor/components/empty-draft-form-state.tsx` |

**To `draft-editor/utils/`:**

| Current path | New path |
|---|---|
| `utils/form-question-order.ts` | `draft-editor/utils/question-order.ts` (renamed) |
| `utils/form-question-dependencies.ts` | `draft-editor/utils/question-dependencies.ts` (renamed) |
| `validation/question-form-schema.ts` | `draft-editor/utils/question-form-schema.ts` |

**To `historical-viewer/components/`:**

| Current path | New path |
|---|---|
| `components/historical-viewer-page-client.tsx` | `historical-viewer/components/historical-viewer-page-client.tsx` |
| `components/layout/historical-viewer-shell.tsx` | `historical-viewer/components/historical-viewer-shell.tsx` |
| `components/loading/historical-viewer-skeleton.tsx` | `historical-viewer/components/historical-viewer-skeleton.tsx` |
| `components/historical-viewer/historical-viewer.tsx` | `historical-viewer/components/historical-viewer.tsx` |
| `components/historical-viewer/historical-viewer-header.tsx` | `historical-viewer/components/historical-viewer-header.tsx` |
| `components/historical-viewer/checkout-confirm-dialog.tsx` | `historical-viewer/components/checkout-confirm-dialog.tsx` |

### Import path updates

After the moves, **every import inside `src/features/form-builder/`** that
crossed a folder boundary changes path. Imports from outside the feature
(the three `src/app/(home)/forms/*/page.tsx` route entries) also update,
because the three page-client paths change.

Files touched by import updates (Phase 1):

- All ~35 component files inside the feature reference at least one
  sibling, util, or schema by path.
- The 3 route entries under `src/app/(home)/forms/`:
  `page.tsx`, `draft/page.tsx`, `[version]/page.tsx`.
- No BFF route or `src/api/` file imports anything under
  `src/features/form-builder/`, so no API-layer files change.

The renames produce three additional import-symbol updates that touch
behavior only through identifier resolution:

- `from '@/features/form-builder/utils/form-question-prerequisite'` →
  `from '@/features/form-builder/utils/prerequisite'`.
- `from '../utils/form-question-order'` →
  `from '../utils/question-order'`.
- `from '../utils/form-question-dependencies'` →
  `from '../utils/question-dependencies'`.

The exported symbol names (`describePrerequisite`, `nextOrderFor`,
`findDependentQuestions`, etc.) **do not change** in Phase 1.

### Verification (Phase 1)

After all moves and import updates:

```
npx tsc --noEmit
npx eslint src/features/form-builder src/app/api/programs src/app/\(home\)/forms
yarn format
```

A clean tsc + lint is sufficient evidence Phase 1 preserved functionality.
The runtime behavior of every component, every hook, every route is
unchanged — only file locations and import paths moved.

### Phase 1 — progress (closed)

All ~45 files moved on branch `VCV-209`; `tsc --noEmit` and `eslint`
clean across the touched paths and the three route entries.

**Deviations applied intentionally during the move:**

- **Singular `empty-state/` and `question/`** instead of the plural
  variants in the original layout. Used consistently across all
  subfeatures.
- **`checkout/` instead of `dialogs/`** under `historical-viewer/
  components/`. Groups by user-facing action rather than UI
  primitive — scales if a non-dialog checkout surface (status pill,
  result toast) ever lands.
- **`draft-editor/validation/` retained** as the home for
  `question-form-schema.ts` instead of folding the file into
  `draft-editor/utils/`. Intended home for future Zod schemas; not
  promoted out until a second consumer arrives.
- **Renames beyond the three the plan called out:**
  - `form-error-banner.tsx` → `form-builder-error-banner.tsx`
    (component `FormErrorBanner` → `FormBuilderErrorBanner`).
  - `forms-page-client.tsx` → `form-versions-page-client.tsx`
    (component `FormsPageClient` → `FormVersionsPageClient`).
  - `forms-page-shell.tsx` → `form-versions-page-shell.tsx`
    (component `FormsPageShell` → `FormVersionsPageShell`).
  - "Form versions" is more precise than "forms" — the page lists
    form versions, not forms.

**Naming rule confirmed during the move:**

Files inside a single-purpose subfolder are named
`<subfolder-noun>-<role>.tsx`, e.g. `diff/diff-summary.tsx`,
`layout/draft-editor-shell.tsx`, `viewer/historical-viewer.tsx`,
`prerequisite/prerequisite-predicate-row.tsx`. The folder-name
prefix is *not* removed even though the folder context already
implies it, because:

- It matches the dominant pattern across every other subfolder in
  the feature.
- Component names must stand alone at call sites; folder context
  is not visible to a reader of `<PredicateRow />`, only to a
  reader of `<PrerequisitePredicateRow />`.
- The `filename === component-kebab` convention cascades —
  dropping a file prefix forces dropping the component prefix,
  which makes call sites harder to scan.

Exceptions are files whose name *replaces* the folder noun with a
more specific one (`editor/form-name-inline-edit.tsx`,
`question/options-editor.tsx`) rather than dropping it.

**Renames still on the table, not yet applied:**

- `draft-editor/components/empty-state/empty-draft-form-state.tsx`
  → `no-questions-empty-state.tsx`. Component's own copy reads "No
  questions yet"; it's a "no questions in this draft" state, not
  an "empty draft form" state. Also matches the sibling
  `no-current-form-empty-state.tsx` suffix pattern under
  `form-versions-list/components/empty-state/`.
- `draft-editor/components/question/question-sheet.tsx` →
  `question-form-sheet.tsx`. The sheet hosts the question form;
  the longer name disambiguates from `question-card`,
  `question-list`, `question-form` in the same folder.

**Outstanding fix from the move:**

[src/app/(home)/forms/page.tsx](../../../src/app/(home)/forms/page.tsx)
still uses the old local alias `FormsPageClient` for what is now
`FormVersionsPageClient`. Runtime-safe (default imports alias
locally) but inconsistent with every other call site. Rename the
local to `FormVersionsPageClient`.

---

## Phase 2 — file-by-file cleanup (no behavior change)

Every item below has a paired statement of *why functionality is
preserved*. The order is small-blast-radius first, big-util-refactor last.

### F. Drop the `validation/` folder

**Change:** delete `src/features/form-builder/validation/` after its
contents move to `draft-editor/utils/question-form-schema.ts` in Phase 1.

**Functionality preserved:** pure folder/file rename. The schema
(`questionFormSchema`) and inferred type (`QuestionFormInput`) keep their
public names and structure. Only one file imports it
(`question-form.tsx`), and that import is already updated by Phase 1.

**Extent:** 0 net code lines; 1 folder removed; 0 additional imports
beyond Phase 1.

### G. Skeleton dedupe (within each subfeature)

**Change:** within each skeleton file
(`form-versions-list-skeleton.tsx`, `draft-editor-skeleton.tsx`,
`historical-viewer-skeleton.tsx`), dedupe blatant copy-paste of skeleton
primitives. Do **not** create a shared skeleton helper across subfeatures —
the per-subfeature "self-contained" decision applies here too.

**Functionality preserved:** skeletons are presentational only; they
render before any data is available. Dedupe within a file does not change
the rendered tree.

**Extent:** estimated ~20-40 lines removed across the three files. No
behavior change.

### H. Comment and `<Fragment>` audit

**Change:** apply project standards — remove comments that narrate the
next line, remove `<Fragment>` wrappers that wrap a single child. The
known `<Fragment>` in `question-form.tsx` wraps a `<div>` + `<SheetFooter>`
pair (two children, so the Fragment stays — verify on inspection;
candidates for removal are Fragments wrapping single children).

**Functionality preserved:** comments are non-executable. `<Fragment>`
wrapping a single child renders the same tree as the bare child.

**Extent:** ~10-20 lines across the feature. No behavior change.

### I. Drop the `try/catch` in `question-card.tsx` reorder

**Change:** the `move(direction)` async handler in
`question-card.tsx` wraps `mutateAsync` in `try/catch`. The project
convention is that UI never uses `try/catch` because `fetchXxx` helpers
return `Result<T, NetworkError>` and never throw. If the `mutateAsync`
path is verified safe, drop the `try/catch` and lean on
`result.ok === false` for the error toast.

**Functionality preserved IF AND ONLY IF** `usePutQuestionToDraftForm`'s
`mutateAsync` does not throw on network failure. Verification step: read
the hook source. If the hook throws (TanStack default behavior is to
throw on `mutationFn` rejection), then either (a) keep the `try/catch`
or (b) harden the hook's `mutationFn` to never throw. The status.md
"Deferred decisions" entry on `fetchXxx` hardening notes this is a
known codebase-wide gap; this commit may *defer* the catch removal until
the hardening lands.

**Extent:** ~6 lines removed in `question-card.tsx` if applied; 0 lines
if deferred. No behavior change.

### C. Inline `question-form.tsx`'s CRUD branching

**Change:** `question-form.tsx` has two `mutate(...)` blocks for create
vs. update, each with duplicated `onSuccess` (toast.success + onClose)
and `onError` (toast.error). Collapse to a single submit handler that
picks the mutation and the verb up front, then writes the toast
callbacks once. Also replace the local `QUESTION_TYPE_OPTIONS` array
with values derived from `QUESTION_TYPE_LABELS` (the shared util),
removing a duplicated labelling table.

**Functionality preserved:** the create and update paths still invoke
the correct mutation hook with the same request payloads and side
effects. The toast copy ("Question added" vs. "Question saved") is
preserved verbatim by selecting the success label from a small const.
The `QUESTION_TYPE_LABELS` mapping is the same data as the local
options array, so the rendered Select shows identical text and binds the
identical underlying values.

**Extent:** ~40-60 LOC reduction in `question-form.tsx`. No behavior
change; no contract change.

### E. Variable and helper renames

**Change:** apply the "every identifier conveys what it holds" standard.
Concrete renames already on the table:

- `move(direction)` in `question-card.tsx` → `swapWithSibling(direction)`.
- `isCreateQuestionInDraftFormPending` /
  `isUpdateQuestionInDraftFormPending` → `isCreatingQuestion` /
  `isSavingQuestion` (or, after item C, the single
  `isSubmitting` already in the file becomes the only flag).
- Local helper `prerequisiteExpressionReferencesQuestion`
  (`question-dependencies.ts`) → `referencesQuestion`.
- Local helper `findSiblingsContainingQuestion`
  (`question-order.ts`) → `findSiblings`.
- Public util `nextOrderFor(draft)` → `nextQuestionOrder(draft)`. Touches
  the one call site in `question-form.tsx`.

**Functionality preserved:** every rename is a pure identifier swap.
TypeScript checks the call sites; no runtime semantics change.

**Extent:** ~3-5 identifier renames per file across ~6 files. No
behavior change.

### J. `prerequisite-editor.tsx` / `prerequisite-predicate-row.tsx`
readability pass

**Change:** these two are the longest non-`question-form.tsx`
components in the draft-editor (229 and 193 LOC respectively). The
cleanup is a structured read-pass for:

- Nested ternaries that could become switch statements or small local
  helper functions.
- JSX blocks deep enough to extract into a same-file local helper
  *function* (not a same-file local component — status.md forbids that;
  if a JSX block deserves its own component, it earns its own file).
- Redundant `useWatch` subscriptions or memoized values that the
  current render already supplies.

**Functionality preserved:** every change in this item is a refactor
that produces an identical rendered tree. The editor's behavior under
the operator-by-question-type filter, the value-shape selection, and
the live preview sentence is asserted to match by manual exercise
against `Default Surveillance Form v1.0.6` after the pass.

**Extent:** estimated ~30-60 LOC reduction across the two files. No
behavior change; no contract change.

### D. `form-version-diff.ts` (496 LOC) slimming

**Change:** the diff util has three layers — the level-by-level matcher,
the field-change builder, and the prerequisite-equivalence walker.
Specific candidates:

- `arePrerequisiteExpressionsEquivalent` and
  `arePrerequisiteValuesEqual` are large recursive equality helpers
  that closely mirror logic already present in `prerequisite.ts`.
  Investigate whether the comparison can be expressed as a single
  structural walker over the discriminated union, removing the four
  parallel branches.
- `arePrerequisiteValuesEqual` is a manual array-equality helper.
  Consider a single small `===`-plus-array-shallow-equal expression at
  the call site; if that reads as cleaner, inline.
- The similarity-matcher block (~50 lines) uses a nested `while` /
  `for` to find best-pair matches. The algorithm is correct; the
  expression of it can likely be tightened with `Array.reduce` or
  earlier-exit checks.

**Functionality preserved:** the diff util is a pure function over the
`Form` type. Identical inputs must produce identical outputs. The
verification approach is to construct three fixture pairs by hand
(an added question, a modified question, a reparented question) and
compare the `QuestionDiff` output before and after the refactor. Each
fixture is a one-time inline snippet; no test infrastructure is added.

**Extent:** estimated ~80-120 LOC reduction. No behavior change is
acceptable; if any fixture diverges, the change is reverted.

---

## Functionality preservation strategy

The cleanup is a refactor, not a rewrite. The strategy for keeping
behavior unchanged is:

1. **TypeScript as the first verification gate.** After every file
   change, `npx tsc --noEmit` must pass before the next change. The
   contract types (`Form`, `FormQuestion`, `PrerequisiteExpression`)
   are unchanged, so any incompatible refactor surfaces immediately at
   the type boundary.
2. **No contract changes.** Zod schemas, exported types, BFF response
   shapes, server-function signatures, and TanStack hook signatures are
   not touched in either phase. The cleanup is internal to the feature
   layer.
3. **No hook-signature changes.** TanStack Query hook arguments and
   return shapes (`useGetDraftFormByProgramId`,
   `usePutQuestionToDraftForm`, etc.) are not modified.
4. **No copy changes.** Toast strings, button labels, page descriptions,
   placeholders, and empty-state copy are preserved verbatim. Cleanup
   that *would* change visible text is out of scope.
5. **No URL or route changes.** App router pages stay at the same paths.
   BFF routes stay at the same paths.
6. **Manual exercise after each phase.** Status.md's verification
   checklist (versions list renders correctly, draft editor CRUD saves
   and refetches, prerequisite editor restricts operators by type,
   historical viewer diff renders, publish creates a new version) is
   the acceptance criterion for both phases.

For the one item that materially rewrites logic (item D — diff util
slimming), the additional safeguard is per-fixture comparison of
`diffFormVersions` output before and after, against three hand-written
input pairs covering added / modified / reparented questions.

---

## Extent of changes (summary)

| Layer | Files touched | Phase | Behavior change |
|---|---|---|---|
| Backend resource layer (`src/api/form/`, `src/api/form-question/`) | 0 | — | None |
| BFF routes (`src/app/api/programs/[programId]/forms/`) | 0 | — | None |
| App router pages (`src/app/(home)/forms/`) | 3 (import paths) | 1 | None |
| Feature layer (`src/features/form-builder/`) | ~45 (every file) | 1 + 2 | None |
| Total | ~48 | 1 + 2 | None |

### Line-count expectations

| Item | Estimated LOC reduction |
|---|---|
| G — skeleton dedupe | 20–40 |
| H — comment / Fragment audit | 10–20 |
| I — reorder try/catch (if applied) | 6 |
| C — question-form CRUD inline | 40–60 |
| E — variable renames | 0 net |
| J — prerequisite editors readability | 30–60 |
| D — form-version-diff slimming | 80–120 |
| **Total estimated reduction** | **~190–310 LOC** |

The Phase 1 moves themselves are LOC-neutral.

---

## Sequencing

**Phase 1** (user applies):

1. Create new folders (`form-versions-list/components/`,
   `draft-editor/components/`, `draft-editor/utils/`,
   `historical-viewer/components/`, `components/diff/`).
2. `git mv` each file per the move tables above.
3. Apply the three file renames.
4. Update import paths across the touched files.
5. `npx tsc --noEmit` clean.
6. Delete the now-empty old folders
   (`components/draft-editor/`, `components/form-versions-list/`,
   `components/historical-viewer/`, `components/empty-state/`,
   `components/error/`, `components/layout/`, `components/loading/`,
   `validation/`).
7. Manual smoke test of the three pages.

**Phase 2** (per-file cleanup, executed in order):

1. F — `validation/` removal (already done by Phase 1's move step).
2. G — skeleton dedupe.
3. H — comment / Fragment audit.
4. I — reorder `try/catch` (verify hook safety; defer if uncertain).
5. C — `question-form.tsx` CRUD inline.
6. E — variable / helper renames.
7. J — prerequisite editor readability pass.
8. D — `form-version-diff.ts` slimming (with fixture-pair verification).

After each item: `npx tsc --noEmit` + `npx eslint <changed paths>`.
After all items: full manual exercise against
`Default Surveillance Form v1.0.6` per status.md commit-12 checklist.

---

## Verification

After Phase 1:

```
npx tsc --noEmit
npx eslint src/features/form-builder src/app/api/programs 'src/app/(home)/forms'
```

After Phase 2:

```
npx tsc --noEmit
npx eslint <changed paths>
yarn format
```

Plus the full PRD use-case exercise:

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
- Cross-subfeature shared abstractions (`<ProgramGate>`, `<PageShell>`)
  — explicitly rejected during planning.
- Empty placeholder `utils/` folders for subfeatures without
  utilities.
- Codebase-wide `fetchXxx` hardening (deferred to its own commit per
  status.md's deferred-decisions list).
- Automated tests, test infrastructure, or test scaffolding.
- Convention-document updates beyond this file. Status.md's
  conventions section continues to describe the previous layout for
  the audit trail; this file is the canonical record of the cleanup.
