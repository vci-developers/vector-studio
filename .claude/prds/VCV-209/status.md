# VCV-209 — Implementation Status & Conventions

Companion to [implementation-plan.md](./implementation-plan.md) and
[VCV-209-form-builder.md](./VCV-209-form-builder.md). The plan answers
*what* and *in what order*. This document answers *where are we right now*
and *which conventions we've committed to as we build*.

---

## Where we are

**Branch**: `VCV-209`

| #  | Commit                                  | Status            |
| -- | --------------------------------------- | ----------------- |
| 1  | shadcn primitives                       | ✅ done (5b8b3b8) |
| 2  | Form domain contracts                   | ✅ done           |
| 3  | Server functions                        | ✅ done           |
| 4  | BFF routes                              | ✅ done           |
| 5  | Query keys + TanStack hooks             | ✅ done           |
| 6  | Builder utilities                       | ✅ done           |
| 7  | Versions list page                      | ✅ done           |
| 7.5| Design-language pass (interim)          | ✅ done           |
| 8  | Draft editor (shell, rename, CRUD)      | ✅ done           |
| 9  | Prerequisite editor                     | ✅ done           |
| 10 | Publish + checkout dialogs              | ✅ done           |
| 11 | Historical viewer + pre-publish diff    | ✅ done           |
| 12 | Polish + consistency cleanup            | in progress (Phase 1 done) |

### Commit 6 — closed

Three pure-function modules under `src/features/form-builder/utils/`:

- [x] `form-question-dependencies.ts` — `findDependentQuestions` for the
      delete blocker.
- [x] `form-question-order.ts` — `nextOrderFor`, `swapAdjacentSiblings`.
- [x] `form-question-prerequisite.ts` — `OPERATOR_LABELS`,
      `OPERATORS_BY_QUESTION_TYPE`, `isPrerequisiteEditable`,
      `getPrerequisiteConnector`, `getPrerequisitePredicates`,
      `buildPrerequisite`, `describePrerequisite`.

Deviations from the plan:

- **No `flatten-form-questions.ts`.** Each consumer's tree walk does
  something distinct (collect dependents, find max order, locate
  siblings, look up a label) and a shared flattener would force a
  middle representation no consumer keeps. Inline per "three similar
  lines beats a premature abstraction."
- **No `parsePrerequisite` / `serializePrerequisite`.** Replaced with
  read helpers (`getPrerequisiteConnector`, `getPrerequisitePredicates`)
  and a write helper (`buildPrerequisite`) over `PrerequisiteExpression`
  directly. The editor's `EditorPrerequisite` intermediate type is gone.
- **No `operatorsForQuestionType` wrapper.** Consumers read
  `OPERATORS_BY_QUESTION_TYPE[question.type]` directly — one indirection
  removed.
- **No precomputed `questionsById` Map in
  `describePrerequisite`.** A small recursive `findQuestionById` walks
  on demand. Same asymptotic cost at the scale we operate at.

### Commit 7 — closed

Versions list page under `src/app/(home)/forms/` plus a tree of
feature components under `src/features/form-builder/components/`
organised by purpose. Only the client entry
(`forms-page-client.tsx`) lives at the root of `components/`; every
other component sits in a single-purpose subfolder.

**File layout:**

- [x] `src/app/(home)/forms/page.tsx` — server entry. Composes
      `<FormsPageShell>` around `<FormsPageClient />` so the h1
      paints SSR-first.
- [x] `components/forms-page-client.tsx` — `'use client'`; perms
      gate. Reads `programId` from `useGetUserPermissions`. Renders
      `<FormVersionsListSkeleton>` (perms loading),
      `<FormErrorBanner>` with Retry (perms failure),
      `<UgandaProgramEmptyState>` (`programId === UGANDA_PROGRAM_ID`),
      or `<FormVersionsList programId>`.
- [x] `components/layout/forms-page-shell.tsx` — server; h1 + fixed
      description + max-width container. Composed exactly once at the
      page level, not per state variant.
- [x] `components/loading/form-versions-list-skeleton.tsx` — three
      shaped placeholder sections matching the eventual layout. Used
      only for the perms-pending state; each section component owns
      its own internal skeleton too.
- [x] `components/error/form-error-banner.tsx` — reusable
      destructive `role="alert"` banner with optional `title` and
      `onRetry`. Used by the perms gate, the current-version section,
      and the previous-versions section.
- [x] `components/empty-state/uganda-program-empty-state.tsx` —
      plain-language card explaining the builder is not yet enabled
      for the legacy program.
- [x] `components/empty-state/previous-versions-empty-state.tsx` —
      dashed-border icon-led empty state for the "no previously
      published versions yet" case.
- [x] `components/form-versions-list/form-versions-list.tsx` — thin
      composer of the three sibling sections. No fetching at this
      level.
- [x] `components/form-versions-list/form-versions-section.tsx` —
      `<section>` + uppercase muted `<h2>` wrapper. Reused by every
      section.
- [x] `components/form-versions-list/current-version-section.tsx` —
      `'use client'`; owns `useGetCurrentFormByProgramId`. Renders
      skeleton, `<FormErrorBanner>` with Retry, or the active form
      card with an emerald "Active" badge and a `date-fns` published
      date.
- [x] `components/form-versions-list/draft-version-section.tsx` —
      static CTA card linking to `/forms/draft`. No fetch, no state.
- [x] `components/form-versions-list/previous-versions-section.tsx` —
      `'use client'`; owns `useGetFormsByProgramId`. Piggybacks on
      the shared cache via `useGetCurrentFormByProgramId` to exclude
      the active version from the list. Renders skeleton,
      `<FormErrorBanner>` with Retry, `<PreviousVersionsEmptyState>`,
      or a divided list of rows linking to `/forms/{version}`.

**Component hierarchy:**

```
<FormsPage>                                          (server; renders shell + client)
  └─ <FormsPageShell>                                (server; h1 + container)
        └─ <FormsPageClient>                         ('use client'; perms gate)
              ├─ <FormVersionsListSkeleton />              (perms loading)
              ├─ <FormErrorBanner onRetry … />             (perms failure)
              ├─ <UgandaProgramEmptyState />               (programId === UGANDA_PROGRAM_ID)
              └─ <FormVersionsList programId>              (dynamic program)
                    ├─ <CurrentVersionSection programId>   (owns /current)
                    │     skeleton / banner / Card + Active badge
                    ├─ <DraftVersionSection />             (static CTA)
                    └─ <PreviousVersionsSection programId> (owns list; reads /current from cache)
                          skeleton / banner / empty state / divided list
```

**Deviations from the plan:**

- **Shell hoisted to the server page level**, not composed at every
  leaf. H1 paints SSR-first, the client owns no chrome, and the
  shell appears exactly once. A single fixed page description reads
  truthfully across loading / error / Uganda / list states.
- **Section-localized error UI**, not silent degradation. Fetch
  failures surface as banners *in the section that failed*, each
  with a Retry button — matching the AWS console / GitHub pattern.
  Errors live where the failure is; degrading silently hides real
  problems.
- **Sibling section components own their own queries.** The original
  plan inlined `<CurrentVersionCard>`, `<DraftVersionCard>`,
  `<PublishedVersionRow>` inside a stateful `<FormVersionsList />`.
  The final shape has three section components each handling their
  own loading / error / empty / success branches; the parent is a
  thin composer.
- **`<FormErrorBanner>` replaces `<FormsPageError>`.** Reusable
  banner with optional `title` and `onRetry`. Used in three places
  (perms, current, previous).
- **Best-effort current-version filter.** The previous-versions
  section subscribes to the current-form query for filtering only.
  When current is loading or errored, the filter is skipped and the
  active version may briefly appear in the list — already surfaced
  by the Active badge above. The current section's banner is the
  source of truth for the retry. The duplication self-heals.
- **No `format-published-date` util.** `date-fns` is already in the
  project; `format(new Date(createdAt), 'MMM d, yyyy')` is
  inlined at the two call sites. A four-line wrapper failed the
  "three similar lines beats premature abstraction" test.
- **Folder naming is singular**: `error/`, `empty-state/`,
  `loading/`, `layout/`. One purpose per folder, named in the
  singular.
- **`PreviousVersionsSection`, not `PublishedVersionsSection`.** Only
  one version is "published" at a time — the current. The list
  shows versions that *used to be* published. The visible section
  label stays "Previously published" for the non-technical
  audience.
- **"No current form" 404 mapped to an empty state in the component**,
  not at the API boundary. The upstream returns 404 on
  `/programs/{id}/forms/current` when no version has been set as
  active — a domain state, not a network failure. The boundary-
  translation option (server function maps `not_found` → `ok(null)`,
  schema becomes `formSchema.nullable()`) was rejected in favour of
  a single component branch: `if (!result.ok &&
  result.error.kind === 'not_found') return <NoCurrentFormEmptyState>;`
  Smaller diff, no contract change. The trade-off is a narrow
  carve-out from "never use a fetch failure as a domain gate" — the
  carve-out is principled because upstream's 404 is the *documented*
  signal for "no current form," not a generic failure being
  reinterpreted.
- **`NoCurrentFormEmptyState`** added under
  `components/empty-state/`. Dashed border + `FileText` icon,
  matches `PreviousVersionsEmptyState` shape but distinct copy
  pointing the user at the Draft section below.
- **Current-version card is clickable.** Wrapped in a
  `<Link href={`/forms/${currentForm.version}`}>` so clicking routes
  to the historical viewer (commit 11) at the current form's version
  — the same destination as a previously-published row. The current
  form is "just another published version" from a routing
  perspective; the UI affordance is unified. Hover/focus treatment
  is intentionally minimal pending the design-language pass below.

**Assumptions and requirements that held:**

- **Legacy gate uses `programId === UGANDA_PROGRAM_ID` (= 1)**, not a
  fetch error. The constant lives in `forms-page-client.tsx` with a
  TODO; remove the gate once Uganda migrates.
- **TanStack query `data.ok === false` is the only error signal.**
  `fetchXxx` helpers never throw, so `query.error` / `query.isError`
  never fire. Discriminate on `result.ok`.
- **Banner, not toast, for load failures.** Persistent banners for
  states the user must read and act on. Toasts are reserved for
  transient post-action feedback (commit 8+).
- **`UGANDA_PROGRAM_ID` is named, not magic.** Naming the specific
  program is more honest about the temporary nature of the gate
  than a generic `LEGACY_PROGRAM_ID`.

**Verification:**

`npx tsc --noEmit && npx eslint src/features/form-builder src/app/(home)/forms`
runs clean.

---

### Commit 7.5 — closed

Visual-only pass anchoring the design vocabulary commits 8–11
inherit. No behavioural changes; no shifts to the
three-sibling-sections decomposition from commit 7.

**Resolved open questions:**

- **Sections + rows, or one unified list?** Sections kept. The
  three sibling sections (current / draft / previously published)
  stay; the row shape inside each is unified so the page reads as
  one visual language with three labelled groups.
- **Section labels: keep, restyle, or drop?** Kept uppercase
  muted, tightened only. Bumped from `text-xs font-medium` to
  `text-sm font-semibold tracking-wide`. The sentence-case
  alternative was considered and rejected — uppercase muted reads
  as a quiet category label, the sentence-case version competed
  visually with the row titles below it.
- **Active badge: dot, text, or both?** Dot + label, inline with
  the form name. `size-1.5 rounded-full bg-success` dot followed
  by "Active" in `text-muted-foreground text-xs font-medium`.
  Uses the `--success` theme token so light/dark track
  automatically. Replaces the off-palette custom emerald pill.

**Row vocabulary (applies to current, draft, previous rows):**

- Container: `<Card className="gap-0 p-0">` for single-row
  sections; `<Card className="divide-border gap-0 divide-y p-0">`
  for the divided list. The `gap-0 p-0` overrides neutralise
  Card's vertical-stack defaults so the inner Link drives row
  paddings.
- Row: `<Link>` wraps the entire row. Classes:
  `group flex items-center gap-4 px-4 py-3.5
  hover:bg-muted/40 focus-visible:bg-muted/40
  focus-visible:outline-ring/60 focus-visible:outline-2
  focus-visible:-outline-offset-2 transition-colors`.
- Content: `min-w-0 flex-1 space-y-1`. Title row is
  `text-sm font-medium` (truncated on overflow); meta row is
  `text-muted-foreground text-xs` formatted as
  `Version {v} · Published {date}`.
- Trailing affordance: `ChevronRight size-4` in
  `text-muted-foreground/60 group-hover:text-muted-foreground
  transition-colors`. The draft row swaps the chevron for an
  inline `text-primary` "Edit draft" + `PencilLine size-3.5`
  with `group-hover:underline` — no nested Button, since the
  whole row is already a Link.

**Empty-state vocabulary:**

- Full shadcn primitive composition: `Card` + `CardHeader` +
  `CardTitle` + `CardDescription`. Leading icon goes **inside**
  `CardTitle` via `className="flex items-center gap-2"`. Icon is
  `size-5 text-muted-foreground`.
- Applies to `NoCurrentFormEmptyState` and
  `PreviousVersionsEmptyState`. `UgandaProgramEmptyState` already
  used this composition in commit 7 and stays untouched.
- The dashed-border + center-aligned variant from commit 7 is
  retired.

**Page shell rhythm:**

- Outer: `mx-auto w-full max-w-3xl space-y-8 py-8`.
- Header: `space-y-1.5`; description gets `leading-relaxed`.
- Between-section spacing: `space-y-8` at the list level.
- Within-section spacing: `space-y-2.5` (label → container).

**Skeleton vocabulary:**

- Section-label skeleton: `Skeleton h-4 w-28`.
- Row-shaped skeleton inside the same `Card gap-0 p-0` container
  the loaded row uses. Title-line `h-4 w-56`, meta-line
  `h-3 w-40`, trailing `size-4 shrink-0`. No reflow on first
  paint when data lands.

**Deviations from the pre-pass scope:**

- **Card primitive left untouched.** Pre-pass scope item 3
  ("Replace shadcn's default `rounded-xl` + `ring-1` +
  `shadow-xs` with thin `border` only") was framed as a
  primitive-level refactor. Shipped instead as `gap-0 p-0`
  overrides applied at each row use-site. Card keeps its default
  `rounded-xl ring-1 shadow-xs` chrome everywhere across the app
  — including the forms page row containers, which inherit the
  ring + shadow from the unmodified primitive. The primitive-level
  refactor was deferred to keep the visual change scoped to the
  forms feature; it can land later as a standalone pass if the
  design language extends to other surfaces.
- **Section labels kept uppercase muted**, not switched to
  sentence-case as the scope item proposed. Tightened only —
  see "Resolved open questions" above.
- **No CardAction slot for the trailing chevron/edit affordance.**
  The chevron and the "Edit draft" inline element sit as direct
  children of the row Link via flex, not as `<CardAction>`
  slots — because the row Link IS the row content, not a Card
  with header/footer slots. Card here is a borderless container,
  not a full slotted card.

**Verification:**

`npx tsc --noEmit && npx eslint src/features/form-builder src/app/(home)/forms`
runs clean.

**Downstream implications (unchanged from pre-pass):**

- Commits 8–11 inherit the row vocabulary, empty-state shape,
  hover/focus treatment, Active-marker pattern, and Card-with-
  overrides convention. The draft editor's `<QuestionCard>` will
  use the same `Card gap-0 p-0` + row-Link pattern; the
  prerequisite editor's predicate rows follow the same shape;
  the historical viewer's read-only question list reuses the
  row structure with edit affordances removed.
- Commit 12 stays scoped to consistency cleanup against the
  language set here, not redesign.

---

### Commit 8 — closed

Draft editor page covering shell, inline rename, and full question
CRUD (add, edit, delete, reorder, add follow-up). Visibility-rule
UI is stubbed; commit 9 fills it in. Routes under
`src/app/(home)/forms/draft/` plus a tree of feature components
under `src/features/form-builder/components/draft-editor/` and one
shared schema file under `validation/`.

**File layout:**

- [x] `src/app/(home)/forms/draft/page.tsx` — server entry.
      Composes `<DraftEditorShell>` around
      `<DraftEditorPageClient />`.
- [x] `components/layout/draft-editor-shell.tsx` — server; back
      link to `/forms`, h1 ("Edit draft"), and fixed page
      description. Composed exactly once at the page level.
- [x] `components/draft-editor-page-client.tsx` — `'use client'`;
      perms gate. Reads `programId` from `useGetUserPermissions`.
      Renders `<DraftEditorSkeleton>` (perms loading),
      `<FormErrorBanner>` with Retry (perms failure),
      `<UgandaProgramEmptyState>` (`programId === UGANDA_PROGRAM_ID`),
      or `<DraftEditor programId>`.
- [x] `components/draft-editor/draft-editor.tsx` — `'use client'`;
      owns `useGetDraftFormByProgramId`, the four sheet/dialog
      state pieces, and composes header + list + sheet + dialog.
      Renders skeleton while the draft loads and
      `<FormErrorBanner>` with Retry on failure.
- [x] `components/draft-editor/draft-editor-header.tsx` — Card
      with a neutral outline "Draft" badge + "Unpublished" meta,
      then the form name as an inline-editable field.
- [x] `components/draft-editor/form-name-inline-edit.tsx` —
      `'use client'`; click-to-edit field calling
      `usePutDraftFormByProgramId`. Enter / check button commits;
      Escape / X button cancels. Toast on failure preserves the
      user's input.
- [x] `components/draft-editor/question-list.tsx` — sorts root
      questions by `order`. Section header has an "Add question"
      outline button when the list is non-empty; otherwise
      renders `<EmptyDraftFormState>` with the same CTA.
- [x] `components/draft-editor/question-card.tsx` — `'use client'`;
      recursive renderer. Each row has ↑↓ icon buttons on the
      left, a click-anywhere-to-edit ghost Button as the label /
      meta column, and a `⋮` dropdown on the right with Edit /
      Add follow-up / Delete. Nested rail (left border + indent)
      renders only when the question has children.
- [x] `components/draft-editor/question-sheet.tsx` — `'use client'`;
      Radix `Sheet` controlled by a derived `isOpen` boolean.
      Title switches between "Edit question", "Add follow-up
      question", and "Add question" based on the primitives passed
      in. Remounts `<QuestionForm>` via `key` when switching modes
      so RHF defaults reset cleanly.
- [x] `components/draft-editor/question-form.tsx` — `'use client'`;
      RHF + `zodResolver` over the shared schema. Branches on
      `questionBeingEdited` to dispatch
      `usePostQuestionToDraftForm` or `usePutQuestionToDraftForm`.
      Uses the shadcn form-id pattern (`<form id="question-form">`
      + `<Button form="question-form">`) so the `SheetFooter`
      submit button can sit outside the form. Visibility-rule
      field is the commit 9 stub: shows `describePrerequisite` if
      set, else "Always shown."
- [x] `components/draft-editor/options-editor.tsx` — `'use client'`;
      manages the `select` question type's dropdown options. Add /
      edit / reorder (↑↓) / remove. Pure state controlled by the
      parent Controller.
- [x] `components/draft-editor/delete-question-dialog.tsx` —
      `'use client'`; runs `findDependentQuestions` on open. If
      the list is non-empty, becomes an explanation dialog listing
      the dependents with no confirm button. Otherwise a confirm
      with a destructive "Delete question" button. Mentions
      sub-question cascade in the description copy when relevant.
- [x] `components/loading/draft-editor-skeleton.tsx` — header
      placeholder + section header + three row-shaped placeholders
      inside a `Card gap-0 p-0` container matching the loaded
      shape.
- [x] `components/empty-state/empty-draft-form-state.tsx` — full
      Card with `ListPlus` icon, copy explaining the next step,
      and an inline "Add question" CTA.
- [x] `validation/question-form-schema.ts` — shared Zod schema +
      derived `QuestionFormInput` type. `.trim()` on label and
      option strings; refine for `select` requiring at least one
      option.

**Component hierarchy:**

```
<DraftFormPage>                                       (server; shell + perms-gate)
  └─ <DraftEditorShell>                               (server; back link + h1 + container)
        └─ <DraftEditorPageClient>                    ('use client'; perms gate)
              ├─ <DraftEditorSkeleton />                    (perms loading)
              ├─ <FormErrorBanner onRetry … />              (perms failure)
              ├─ <UgandaProgramEmptyState />                (programId === UGANDA_PROGRAM_ID)
              └─ <DraftEditor programId>                    (owns draft query + sheet/dialog state)
                    ├─ <DraftEditorHeader programId draft>
                    │     └─ <FormNameInlineEdit programId draft>
                    ├─ <QuestionList draft onAdd onEdit onDelete>
                    │     └─ <QuestionCard … />              (recursive)
                    ├─ <QuestionSheet … onClose>             (open derived from primitives)
                    │     └─ <QuestionForm key=mode-id … />
                    │           └─ <OptionsEditor />         (when type === 'select')
                    └─ <DeleteQuestionDialog … onClose>
```

**Deviations from the plan:**

- **`draft-editor-client.tsx` split into perms gate + loaded
  editor**, mirroring the `forms-page-client` → `FormVersionsList`
  pattern from commit 7. Perms-gate
  (`draft-editor-page-client.tsx`) lives at the root of
  `components/`; loaded editor (`draft-editor/draft-editor.tsx`)
  sits in the subfolder and receives `programId` as a real prop.
  Removes the dead `programId === null` defense and the `?? 0` +
  `enabled` plumbing that a single-component shape would have
  required.
- **`question-drawer.tsx` → `question-sheet.tsx`**, matching the
  shadcn primitive's actual name (`Sheet`, not `Drawer`).
- **Question sheet / dialog state held as four primitive
  `useState` pieces**, not a discriminated-union state object.
  `questionBeingEdited: FormQuestion | null`,
  `isAddQuestionSheetOpen: boolean`,
  `parentIdForNewQuestion: number | null`,
  `questionPendingDeletion: FormQuestion | null`. `FormQuestion`
  is the only named shape passed across component boundaries —
  same principle as commit 6's `EditorPrerequisite` removal.
- **Shared form schema lives under `validation/`**, not inline in
  the component. Matches
  `features/auth/validation/login-form-schema.ts` and
  `features/auth/validation/signup-form-schema.ts`. The schema is
  reused by the `zodResolver` and by `z.infer` for the input type.
- **Shadcn form-id pattern** (`<form id="question-form">` +
  `<Button type="submit" form="question-form">`) instead of
  nesting the submit button inside the form. The `SheetFooter` is
  structurally separate from the form body, so the id reference
  is cleaner than spanning the form across the footer.
- **`useWatch({ control, name: 'type' })`** instead of
  `questionForm.watch('type')`. The `watch()` returned from
  `useForm()` is not memoizable, so React Compiler skips
  optimising the whole component on sight. `useWatch` is a
  separate hook the compiler handles correctly.
- **Type change does not clear `options`** in form state. The
  `OptionsEditor` unmounts when type ≠ select, and `onSubmit`
  normalises `options` to `null` for non-select types. Users who
  toggle select → text → select get their options back — minor UX
  win and one less effect to keep in sync.
- **Reorder uses `mutateAsync`** for the two sequential PUTs.
  Plain `mutate` would require nesting the second call in the
  first's `onSuccess`, which reads worse than two awaited results.
  Two-toast scheme: "Couldn't reorder question" if the first PUT
  fails (no second PUT fires); "Reorder finished partway" if the
  second PUT fails (the hook's invalidate-on-success refetches the
  draft so the UI self-heals).
- **Subquestion rail renders only when `subQuestions.length > 0`.**
  The first cut included a dead `|| depth >= 0` condition that
  rendered an "Add follow-up" button under every leaf row,
  duplicating the dropdown menu's "Add follow-up" item. Dropped
  both the dead condition and the inline button — the dropdown is
  the single affordance.
- **`depth` prop removed from `QuestionCard`.** It influenced
  nothing after the rail simplification above.
- **Click-the-label-to-edit is a `<Button variant="ghost">`**, not
  a native `<button>`. Several layout defaults are overridden
  (`h-auto`, `flex-col`, `items-start`, `whitespace-normal`,
  `font-normal`, softer `hover:bg-muted/40`) so the Button hosts
  the two-line label + meta layout while keeping focus-visible
  semantics from the primitive.
- **Uganda gate replicated at `/forms/draft`.** A user could
  bookmark the route directly; the gate matches the one in
  `forms-page-client.tsx` so the experience is consistent. Same
  TODO + `UGANDA_PROGRAM_ID` constant marker.
- **`safeApiCall` hardened to only send
  `Content-Type: application/json` when a body is present.**
  Surfaced by the DELETE question call — upstream rejected
  DELETE-with-Content-Type-and-no-body with "Body cannot be empty
  when content-type is set to 'application/json'". The fix benefits
  every body-less call across the codebase (GETs were sending the
  header unnecessarily; upstream just happened to tolerate it).
  Touches shared infrastructure outside the form-builder scope,
  justified because the bug lives there.

**Assumptions and requirements that held:**

- **`noUncheckedIndexedAccess` is on**, confirmed by
  `form-question-order.ts` already guarding
  `[questionToMove, swapPartner]`. `question-card.tsx` guards
  `[first, second] = swapPair` with the same
  `if (!first || !second) return` pattern — satisfying the type,
  not catching a real case (`swapAdjacentSiblings` always returns
  a length-2 array or `null`).
- **Sheet stays mounted; openness controlled by a derived
  `isOpen` boolean.** Standard Radix pattern. Form remounts via
  `key` so RHF defaults reset between modes (`add at root` →
  `add follow-up under X` → `edit Y`).
- **Hook-level invalidation handles partial-failure recovery.**
  The reorder's "Reorder finished partway" toast relies on the
  put-question hook invalidating the draft cache after each
  successful PUT — the UI converges on whatever state the backend
  reports.
- **Form name inline edit does not sync to `draft.name` during an
  active edit.** `pendingName` is seeded only on `startEditing()`,
  so an external refetch mid-typing does not overwrite the user's
  input.
- **`PutQuestionToDraftFormRequestBody` is `.partial()`**, so
  editing a question without touching the prerequisite simply
  omits the field; the backend preserves the existing rule.
  Required for the commit 9 stub to coexist with edits.

**Verification:**

`npx tsc --noEmit && npx eslint src/features/form-builder src/app/(home)/forms`
runs clean.

---

### Commit 9 — closed

Prerequisite (visibility-rule) editor integrated into the question
form sheet. Authors flat AND/OR rules over the contract's
`PrerequisiteExpression` using natural-language operator labels,
type-aware value inputs, and a live preview sentence. Any existing
rule that uses `not` or nested groups falls through to a read-only
summary. Same-`(questionId, operator)` pairs are blocked within a
single rule; cross-operator semantic conflicts on the same question
are deferred (see Deferred decisions).

**File layout:**

- [x] `validation/question-form-schema.ts` — adds `prerequisite:
      prerequisiteExpressionSchema.nullable()` so the field round-trips
      through RHF + `zodResolver`.
- [x] `api/form-question/contracts/prerequisite-expression-schema.ts` —
      extracts a named `prerequisitePredicateSchema` from the union's
      predicate member; exports a `PrerequisitePredicate` type so util
      and component signatures can narrow to predicates instead of the
      whole union.
- [x] `utils/form-question-prerequisite.ts` — adds
      `getDefaultValueForPredicate(referencedQuestion, operator)`
      (sensible starting value per question type + operator shape) and
      `getOperatorsUsedOnQuestion(predicates, targetQuestionId,
      excludingPredicateIndex)` (operators in use on a given question
      by other predicates). Existing helpers (`OPERATOR_LABELS`,
      `OPERATORS_BY_QUESTION_TYPE`, `isPrerequisiteEditable`,
      `getPrerequisiteConnector`, `getPrerequisitePredicates`,
      `buildPrerequisite`, `describePrerequisite`) unchanged.
- [x] `components/draft-editor/prerequisite-editor.tsx` — top-level.
      Reads `connector` and `predicates` from the wire shape via util
      getters; rebuilds the wire shape via `buildPrerequisite` on every
      change. Branches: read-only `<PrerequisiteComplexRuleSummary>`
      when `!isPrerequisiteEditable`; "Always shown" empty state with
      a disabled "Add condition" when no question can be referenced;
      otherwise the authoring UI with an inline connector toggle (when
      2+ predicates), the predicate list, "Add condition", and the
      live preview sentence.
- [x] `components/draft-editor/prerequisite-predicate-row.tsx` —
      single predicate row. Three controls (question select, operator
      select, value input) plus a remove button. Operator dropdown
      filters out operators already used on the same question by other
      predicates; question dropdown filters out questions whose
      operator slots are fully covered by other predicates.
      `changeReferencedQuestion` picks the first non-conflicting
      operator for the new question's type; `changeOperator` always
      resets the value via `getDefaultValueForPredicate`.
- [x] `components/draft-editor/prerequisite-value-input.tsx` — branches
      on operator first (value-less for `empty`/`not_empty` → renders
      null; list for `in`/`not_in` → chip toggles over the select
      question's own options), then on referenced question type
      (boolean → Yes/No Select; select → option Select; number →
      `<Input type="number">`; date → `<Input type="date">`; text →
      text Input).
- [x] `components/draft-editor/prerequisite-complex-rule-summary.tsx` —
      Lock icon + "Complex rule — view only" outline badge + the
      `describePrerequisite` sentence + a short explanation pointing
      the user at a form administrator. Renders only when the existing
      rule contains `not` or nested groups; the rest of the question's
      fields remain editable and submit preserves the original rule
      verbatim.
- [x] `components/draft-editor/question-form.tsx` — drops the
      `EyeOff`-styled "coming next" stub; threads `prerequisite`
      through RHF defaults, both submit branches, and a `<Controller>`
      wrapping `<PrerequisiteEditor>`.

**Component hierarchy:**

```
<QuestionForm>
  └─ <Controller name="prerequisite">
        └─ <PrerequisiteEditor draft questionBeingEdited expression onChange>
              ├─ <PrerequisiteComplexRuleSummary />          (non-editable rule)
              └─ (editable rule)
                    ├─ connector Select                       (when 2+ predicates)
                    ├─ <PrerequisitePredicateRow … />         (per predicate)
                    │     └─ <PrerequisiteValueInput … />
                    ├─ "Add condition" Button
                    └─ live preview sentence
```

**Deviations from the plan:**

- **Folder layout flat under `draft-editor/`**, not nested under
  `draft-editor/prerequisite-editor/` as the plan called out. All
  four new components sit at the same level as `question-form.tsx`
  and `question-card.tsx`. Avoids a sub-sub-folder for a five-file
  feature.
- **Fewer files than the plan listed.** The plan separated
  `connector-toggle`, `operator-select`, `question-select`, and
  `preview-sentence` into their own components. The connector toggle
  and preview sentence are inlined into the editor as ~10 lines each;
  the question and operator selects are inlined into the predicate
  row. Single-use composites under the "Combine where granularity
  exceeds reuse value" convention.
- **No editor model / intermediate type.** The plan's
  `parsePrerequisite` / `serializePrerequisite` pair plus a named
  `EditorPrerequisite` were rejected for the same reason as commit 6
  — the editor reads `connector` and `predicates` from the contract
  via `getPrerequisiteConnector` / `getPrerequisitePredicates` on
  every render, and writes back via `buildPrerequisite`. The contract
  is the only named shape.
- **No `operatorsForQuestionType` wrapper.** Components read
  `OPERATORS_BY_QUESTION_TYPE[question.type]` directly, same as
  commit 6.
- **Preserve-value-when-operator-shape-unchanged dropped.** An
  earlier cut held a `getOperatorValueShape` util used solely to
  decide whether to preserve the previous value when switching
  between two scalar operators (e.g., `eq` → `neq`). Dropped per the
  "only utils if absolutely needed" rule — used at exactly one call
  site, and inlining the boolean checks at that site was uglier than
  resetting the value to the type-appropriate default on every
  operator change. Minor UX cost (`eq 5` → `neq 5` loses the 5) is
  acceptable.
- **No closure-recursive walk utility for collecting referencable
  questions.** Inline closure-recursive `forEach` lives inside the
  editor body — same idiom as the existing util-internal walkers in
  `form-question-dependencies.ts` and `form-question-order.ts`, but
  located at the call site since it's single-use.
- **No module-level helper functions in component files.** Earlier
  drafts had `collectQuestionsExcludingSelf`,
  `defaultValueForPredicate`, and `operatorValueShape` defined at the
  top of `prerequisite-editor.tsx` / `prerequisite-predicate-row.tsx`.
  Moved into utils where they justified a shared helper
  (`getDefaultValueForPredicate`, `getOperatorsUsedOnQuestion`) and
  inlined the rest.
- **`value` prop → domain-specific names.** Disambiguated based on
  what each prop actually holds:
  `PrerequisiteEditor.prerequisiteExpression`,
  `PrerequisiteValueInput.predicateValue`,
  `PrerequisiteComplexRuleSummary.prerequisiteExpression`. The
  callback names follow the same pattern
  (`onPrerequisiteExpressionChange`, `onPredicateValueChange`,
  `onPredicateChange`, `onRemovePredicate`).
- **Conflict prevention scoped to same-`(questionId, operator)`
  pairs.** Two predicates with identical question + operator are
  blocked via three filters (operator dropdown + question dropdown +
  `addPredicate` skip) and "Add condition" disables when no
  non-conflicting combination remains. Cross-operator semantic
  conflicts on the same question (e.g., `Q1 lt 3 AND Q1 gt 5`,
  `Q1 empty AND Q1 has been answered`) are NOT detected — see
  Deferred decisions.

**Assumptions and requirements that held:**

- **Boundary read helpers + single write helper.** Operating directly
  on the contract via `getPrerequisiteConnector`,
  `getPrerequisitePredicates`, and `buildPrerequisite` (introduced in
  commit 6) keeps the editor stateful without naming any intermediate
  type.
- **`PrerequisiteValueInput` returns `null` for value-less
  operators.** `empty` and `not_empty` render nothing on the right;
  the row reads cleanly as `[question] [has been answered] [×]`.
- **Read helpers default to ALL.** `getPrerequisiteConnector` returns
  `'all'` for a null expression or a single predicate, matching the
  default-ALL UX from the PRD.
- **Complex rules round-trip unchanged.** Because RHF defaults
  `prerequisite` to `questionBeingEdited.prerequisite ?? null` and
  the read-only summary exposes no edit affordance, submitting an
  edited "complex rule" question sends the original prerequisite
  back to upstream verbatim — confirmed by the partial PUT schema.
- **Row's current value is always in the filtered dropdowns.** Both
  the operator and question filters exclude *the row's own
  predicate*, so the predicate's current `(questionId, operator)` is
  never filtered out from its own dropdowns — the Select primitive
  always finds a matching option to display.

**Verification:**

`npx tsc --noEmit && npx eslint src/features/form-builder src/api/form-question`
runs clean.

---

### Commit 10 — closed

Publish and checkout confirmation dialogs. Publish is wired into the
draft editor header; the checkout dialog is created but not yet wired
(its historical-viewer consumer arrives in commit 11).

**File layout:**

- [x] `components/draft-editor/publish-dialog.tsx` — `'use client'`;
      shadcn `Dialog` controlled by `isOpen`. Subscribes to
      `useGetFormsByProgramId` for two purposes: surfacing the latest
      published version as a `<FieldDescription>` reference, and
      blocking duplicate version names via a `Set` lookup. Validates
      non-empty + not-already-used; Enter submits; on success closes
      the dialog, navigates to `/forms`, and surfaces a success toast.
- [x] `components/draft-editor/checkout-confirm-dialog.tsx` —
      `'use client'`; shadcn `Dialog` controlled by
      `formToCheckout: Form | null` (same `null === closed` pattern as
      `questionPendingDeletion`). Plain-language warning about draft
      replacement, destructive confirm, navigates to `/forms/draft` on
      success.
- [x] `components/draft-editor/draft-editor-header.tsx` — accepts
      `onOpenPublishDialog`, adds a default-size "Publish" button on
      the meta row opposite the Draft/Unpublished badge.
- [x] `components/draft-editor/draft-editor.tsx` — adds
      `isPublishDialogOpen` state, wires the open callback into the
      header, renders `<PublishDialog>` alongside the existing sheet
      and dialogs.

**Component hierarchy:**

```
<DraftEditor>                            (owns draft query + dialog state)
  ├─ <DraftEditorHeader onOpenPublishDialog>
  │     ├─ Draft / Unpublished meta row
  │     ├─ Publish button (default size, right side)
  │     └─ <FormNameInlineEdit />
  ├─ <QuestionList … />
  ├─ <QuestionSheet … />
  ├─ <DeleteQuestionDialog … />
  └─ <PublishDialog isOpen programId onClose>
```

**Deviations from the plan:**

- **`checkout-confirm-dialog.tsx` parked under `draft-editor/`**, not
  `historical-viewer/` as the original plan called out. The
  historical-viewer folder doesn't exist yet; the file sits with the
  other draft-editor dialogs. Commit 11 either imports across the
  folder boundary or moves the file at that point.
- **No new query or mutation hooks.** `usePublishDraftFormForProgram`
  (commit 5) invalidates `formKeys.formsByProgramId(programId)` =
  `['forms', programId]`, the per-program prefix. TanStack treats it
  as a prefix match, so a single invalidation covers current / draft
  / list / per-version in one shot. No contracts or hooks touched.
- **No new util for "find latest published" or "collect used
  versions."** Both are ~3-line inline snippets at the only call
  site. The filter-draft + sort-by-createdAt pattern duplicates
  `previous-versions-section.tsx`'s body, but inlining still beats a
  util used twice across two files of trivial logic.
- **Pending version state is not reset on dialog close.** A first
  cut used a `useEffect` to clear `pendingVersion` when `isOpen`
  flipped to false. ESLint's `react-hooks/set-state-in-effect`
  flagged it; dropping the effect entirely was the better fix —
  letting the typed version persist between cancel/reopen avoids
  re-typing on a transient close, and the component unmounts (state
  goes away) on successful publish via `router.push('/forms')`.
- **Best-effort dup-check validation.** When
  `useGetFormsByProgramId` is still pending or errored,
  `publishedForms` stays `null` and the "already used" filter
  short-circuits — the user can submit, and the backend's 409 (if
  the version actually was a duplicate) surfaces as a toast. Same
  best-effort principle as the previous-versions-section's
  current-form filter.

**Assumptions and requirements that held:**

- **Dialog state owned by `draft-editor.tsx`**, same pattern as
  `QuestionSheet` and `DeleteQuestionDialog`. The header receives an
  `onOpenPublishDialog` callback rather than owning dialog state.
- **Publish hook invalidates by prefix.** Documented in commit 5's
  conventions and confirmed in practice this commit — invalidating
  `['forms', programId]` catches all per-program forms queries.
- **Confirm button on checkout uses the destructive variant.** Per
  the design-language convention — replacing the draft discards
  in-progress work and is irreversible.
- **Result envelope is the only error contract.** Both dialogs
  discriminate on `result.ok` inside `onSuccess` with a fallback
  `onError` for the thrown-error path. No try/catch in the UI layer.

**Verification:**

`npx tsc --noEmit && npx eslint src/features/form-builder`
runs clean.

---

### Commit 11 — closed

Shipped a GitHub-style diff between two form versions, used in two
surfaces: the historical viewer (versus the current draft) and a new
publish sheet that previews changes versus the current published
version before commit.

**Files shipped:**

- `utils/form-version-diff.ts` — recursive diff. Two-pass matching:
  pass 1 by question id (global lookup — catches reparenting), pass
  2 by weighted structural similarity within each level for
  questions left unmatched. Similarity weights: Dice coefficient on
  bigrams of normalised labels × 5, type match +2, sibling-position
  +1, options Jaccard +1, required +0.5. Threshold 5 — exact label
  alone (Dice = 1 → 5) is enough to pair, pure same-type-same-
  position (no label overlap) lands at 3 and falls through to
  add+remove. The similarity pass exists because checkout and
  publish copy questions with fresh ids, and id-only matching would
  otherwise show every post-checkout question as add+remove.
- `utils/question-type-labels.ts` — `QUESTION_TYPE_LABELS` lifted
  out of `draft-editor/question-card.tsx` once it reached a third
  call site (diff-question-card label, type field-change row).
- `components/historical-viewer-page-client.tsx` — perms gate,
  mirrors `draft-editor-page-client.tsx`.
- `components/historical-viewer/historical-viewer.tsx` — owns the
  draft + viewed queries, computes the diff, composes header /
  summary / list / checkout dialog.
- `components/historical-viewer/historical-viewer-header.tsx`,
  `diff-summary.tsx`, `diff-question-list.tsx`,
  `diff-question-card.tsx`, `diff-field-change-row.tsx`,
  `diff-scalar-change.tsx` — the diff UI. One component per file.
- `components/loading/historical-viewer-skeleton.tsx`,
  `components/layout/historical-viewer-shell.tsx` — skeleton + page
  shell, parallel to the draft editor's.
- `app/(home)/forms/[version]/page.tsx` — server entry composing
  shell + client.
- `components/draft-editor/publish-sheet.tsx` (replaces
  `publish-dialog.tsx`) — pre-publish diff sheet. Reuses
  `<DiffSummary>` and `<DiffQuestionList>` against
  `(currentPublishedForm, draftForm)`. shadcn `Sheet`, not
  `Dialog`, because the diff content is too tall for a centred
  modal.

**In scope by extension:**

- **Pre-publish diff.** Not in the original plan; brought in mid-
  commit after the historical viewer's diff primitives were
  factored. The publish flow now surfaces the same diff before
  commit, using identical UI components. The old simple-confirm
  `publish-dialog.tsx` was retired.

**Deviations from the original plan:**

- **One named type only.** The plan listed seven (`QuestionDiff`,
  `FormVersionDiff`, `QuestionDiffKind`, three field-change shapes,
  `QuestionFieldChanges`). Reduced to a single recursive
  `QuestionDiff` exported from `form-version-diff.ts`. Everything
  else is structural / inline / accessed via `QuestionDiff['kind']`
  indexed access. The recursive type *must* be named; the rest
  violated the "no intermediate types outside contract schemas"
  rule.
- **`fromForm` / `toForm` prop names.** Originally drafted with
  historical-viewer-specific names (`draftForm`, `viewedForm`). When
  the publish sheet became the second consumer, the prop names were
  generalised and the diff util's parameters followed.
- **Label-equivalent comparison for question references.** Parent
  and prerequisite-`questionId` comparisons dereference ids to
  question labels and compare labels rather than raw ids. After
  publish/checkout the ids are fresh on each side; the resolved
  labels still match, so reparenting and prerequisite references
  survive the id rotation. Captured trade-off in deferred
  decisions.
- **`DiffScalarChange` extracted to its own file.** Originally a
  same-file sub-component inside `diff-question-card.tsx`; pulled
  out once the card used it four times — the
  "one-component-per-file" convention plus "extract on reuse" both
  triggered.
- **`historical-viewer-shell.tsx` added.** Parallels
  `draft-editor-shell.tsx`. The plan implied the shell pattern but
  didn't name the file.

**Algorithm notes for future readers:**

- `buildDiffsForLevel(toQuestions, fromQuestions)` takes both arrays
  directly — *not* a from-side parentId-keyed map. That earlier
  shape had a subtle bug where similarity-matched parents (different
  ids on each side) lost access to their from-side children at the
  next recursion level. Walking subtrees through the matched pair's
  `subQuestions` on both sides eliminates the problem and removes a
  helper.
- Field-change comparisons for `parent` and `prerequisite` use
  `areQuestionReferencesLabelEquivalent`, which dereferences the id
  to a question label and compares labels. Handles the fresh-id
  post-checkout case without needing a global match map.
- Greedy similarity matching at each level: walk all candidate
  pairs, pick the highest-scoring pair above threshold, mark them
  consumed, repeat. O(n³) worst case but n is at most a few dozen
  siblings.

---

### Commit 11 — original plan (Historical viewer, diff-based)

Renamed and rescoped from "Historical viewer" — the diff view that
the PRD's Out of Scope explicitly deferred is now in scope. Replaces
the planned read-only question list with a GitHub-style diff showing
how the viewed historical version differs from the user's current
draft. The checkout-confirm-dialog from commit 10 wires into this
viewer.

**Design decisions resolved up front:**

- **Direction of diff.** Viewed historical version is the TO state,
  current draft is the FROM state. Added (green `+`) = in viewed but
  not draft. Removed (red `−`) = in draft but not viewed. Modified
  (yellow `±`) = in both with field differences. Answers "what would
  change if I check this version out."
- **Granularity.** Question shells diff at the question level
  (added / removed / modified / unchanged). Modified questions
  expand to per-field changes (label, type, required, options,
  prerequisite, parent). Reorders within the same parent are not
  detected — see Deferred decisions.
- **Layout.** Single page replaces the read-only list. No tab or
  toggle. The diff IS the historical viewer.
- **Unchanged questions** render in a muted style with no diff
  marker, so the diff has tree context. No collapse / "Hide
  unchanged" toggle in v1.
- **Walk order.** Render the merged tree in the viewed version's
  order; removed-from-draft questions are appended at the end of
  each parent's children list. Simple, predictable, matches
  GitHub's "removed lines stay near where they used to be" pattern.
- **Checkout flow.** The historical viewer page is the diff surface;
  "Check out" opens the existing small confirm dialog from commit
  10. The dialog is not enhanced with an embedded diff — the diff
  is already visible on the page behind it. Future option of a
  diff-embedded checkout sheet captured under Deferred decisions.

**File layout:**

- `app/(home)/forms/[version]/page.tsx` — server entry. Composes
  the historical-viewer shell around
  `<HistoricalViewerPageClient version={...} />`. The `"draft"`
  segment is handled by the sibling `draft/page.tsx` already, so
  this route never sees it.
- `features/form-builder/utils/form-version-diff.ts` — pure
  function `diffFormVersions(draft, viewedVersion)` returns a
  `FormVersionDiff`. Walks both trees, matches questions by id,
  classifies each as added / removed / modified / unchanged, and
  computes field-level changes for modified questions. This is the
  one place where a named computed type is justified — a diff is
  genuinely new information, not a reorganisation of contract
  fields (see Implementation rules carve-out below).
- `features/form-builder/components/historical-viewer/` — new
  folder, parallel to `form-versions-list/` and `draft-editor/`.
  - `historical-viewer-page-client.tsx` — `'use client'`; perms
    gate identical to the draft editor's. Reads `programId` from
    `useGetUserPermissions`. Renders skeleton, `<FormErrorBanner>`,
    `<UgandaProgramEmptyState>`, or `<HistoricalViewer>`.
  - `historical-viewer/historical-viewer.tsx` — `'use client'`;
    owns `useGetProgramFormByVersion(programId, version)` and
    `useGetDraftFormByProgramId(programId)`. Renders a viewer
    skeleton while either query is pending. On success, computes
    `diffFormVersions(draft, viewedVersion)` and composes header +
    summary + diff list + checkout dialog.
  - `historical-viewer/historical-viewer-header.tsx` — version
    badge, published date, and "Check out" button on the right
    that sets `formToCheckout` on the parent.
  - `historical-viewer/diff-summary.tsx` — top-of-page summary
    pill row: `+X added · −Y removed · ±Z modified`.
  - `historical-viewer/diff-question-list.tsx` — renders the
    recursive question diff tree.
  - `historical-viewer/diff-question-card.tsx` — recursive
    renderer for a single question diff. Card shell coloured by
    status (added=green, removed=red, modified=yellow,
    unchanged=neutral muted). Header shows the diff marker
    (`+` / `−` / `±` / blank) and the label with type/required
    badges. Modified questions expand to show field changes.
  - `historical-viewer/diff-field-change-row.tsx` — single row for
    a modified field. `label · old → new` for scalars,
    `label · +added · −removed` for option lists, natural-language
    sentence before/after for prerequisites (using
    `describePrerequisite`).
  - `loading/historical-viewer-skeleton.tsx` — placeholder shape
    matching the eventual diff layout.
- Commit 10's `checkout-confirm-dialog.tsx` either moves to
  `historical-viewer/` or is imported across the folder boundary.
  Decision deferred to commit-11 execution.

**The diff util — shape:**

```ts
type QuestionDiffKind = 'unchanged' | 'added' | 'removed' | 'modified';

type ScalarFieldChange<T> = { from: T; to: T };

type OptionsFieldChange = { added: string[]; removed: string[] };

type ParentFieldChange = {
    from: { id: number; label: string } | null; // null = root
    to: { id: number; label: string } | null;
};

type QuestionFieldChanges = {
    label?: ScalarFieldChange<string>;
    type?: ScalarFieldChange<FormQuestionType>;
    required?: ScalarFieldChange<boolean>;
    options?: OptionsFieldChange;
    prerequisite?: ScalarFieldChange<PrerequisiteExpression | null>;
    parent?: ParentFieldChange;
};

type QuestionDiff = {
    kind: QuestionDiffKind;
    // For added/modified/unchanged: the FormQuestion from the
    // viewed version. For removed: the FormQuestion from the draft.
    question: FormQuestion;
    fieldChanges: QuestionFieldChanges; // empty unless kind === 'modified'
    children: QuestionDiff[];
};

type FormVersionDiff = {
    questionDiffs: QuestionDiff[];
    summary: {
        added: number;
        removed: number;
        modified: number;
        unchanged: number;
    };
};
```

These are the only two new named types the codebase gains
(`QuestionDiff`, `FormVersionDiff`, plus the supporting field-change
types). They describe a computed view, not a reorganisation of
contract fields — which is the carve-out the Implementation rules
allow: "no intermediate types outside the main domain models"
prohibits aliasing or unpacking contract shapes, not naming
genuinely new information.

**Open subdecisions to resolve during execution:**

- **Whether to expand modified questions by default or via toggle.**
  v1 sketch: expand by default for clarity, since modified questions
  carry the densest information. Revisit if forms with many modified
  questions feel overwhelming.
- **Visual treatment of unchanged questions.** Either muted full row
  (current sketch) or collapsed to a one-line summary. v1 sketch:
  muted full row, no collapse, since forms aren't large enough that
  scroll matters.
- **Where the "Check out" CTA sits.** Header right (next to version
  badge) or sticky footer. v1 sketch: header right, mirroring how
  the draft editor's Publish sits opposite the Draft badge.

**Verification target:**

`npx tsc --noEmit && npx eslint src/features/form-builder src/app/(home)/forms`
runs clean. Manual exercise: pick a published version that has
diverged from the current draft and confirm every category (added,
removed, modified per-field, unchanged) renders as expected,
including a question that has been reparented.

---

### Commit 12 — in progress (Polish + consistency cleanup)

Final pass before the PR opens. Split into two phases per
[cleanup-plan.md](./cleanup-plan.md): Phase 1 is pure file
reorganization (done); Phase 2 is the file-by-file simplification
pass (pending).

#### Phase 1 of cleanup — closed

`src/features/form-builder/` reorganized into three self-contained
subfeatures (`form-versions-list/`, `draft-editor/`,
`historical-viewer/`) plus a shared `components/` + `utils/` root.
~45 files moved; `tsc --noEmit` and `eslint` clean across the
touched paths and the three route entries.

Each subfeature's `components/` folder has the page-client at the
top level; every other component lives in a single-purpose
subfolder (`layout/`, `loading/`, `editor/`, `question/`,
`prerequisite/`, `publish/`, `empty-state/`, `versions-list/`,
`viewer/`, `checkout/`, `diff/`, `error/`).

**Deviations from the original cleanup-plan layout, applied
intentionally:**

- Singular `empty-state/` and `question/` instead of plural. Used
  consistently across all three subfeatures.
- `checkout/` in `historical-viewer/components/` instead of
  `dialogs/`. Groups by user-facing action rather than UI
  primitive — scales if a non-dialog checkout surface lands later.
- `draft-editor/validation/question-form-schema.ts` retained under
  `validation/` rather than folded into `draft-editor/utils/`. The
  folder is the intended home for future Zod schemas; not promoted
  out until a second consumer arrives.
- **Renames beyond the three the plan called out:**
  - `form-error-banner.tsx` → `form-builder-error-banner.tsx`
    (component `FormErrorBanner` → `FormBuilderErrorBanner`).
  - `forms-page-client.tsx` → `form-versions-page-client.tsx`
    (component `FormsPageClient` → `FormVersionsPageClient`).
  - `forms-page-shell.tsx` → `form-versions-page-shell.tsx`
    (component `FormsPageShell` → `FormVersionsPageShell`).

  "Form versions" is more precise than "forms" — the page lists
  form versions, not forms.

**Naming rule confirmed during the move (codebase-wide):**

Files inside a single-purpose subfolder are named
`<subfolder-noun>-<role>.tsx`, e.g. `diff/diff-summary.tsx`,
`layout/draft-editor-shell.tsx`, `viewer/historical-viewer.tsx`,
`prerequisite/prerequisite-predicate-row.tsx`. The folder-name
prefix is *not* removed even though the folder context already
implies it, because:

- It matches the dominant pattern across every subfolder in the
  feature.
- Component names must stand alone at call sites; folder context
  is not visible to a reader of `<PredicateRow />`, only to a
  reader of `<PrerequisitePredicateRow />`.
- The `filename === component-kebab` convention cascades —
  dropping a file prefix forces dropping the component prefix,
  which makes call sites harder to scan.

Exceptions: files whose name *replaces* the folder noun with a
more specific one (`editor/form-name-inline-edit.tsx`,
`question/options-editor.tsx`) rather than dropping it.

**Renames still on the table, not yet applied:**

- `draft-editor/components/empty-state/empty-draft-form-state.tsx`
  → `no-questions-empty-state.tsx`. The component's own copy reads
  "No questions yet"; it's not an "empty draft form" state (the
  draft exists), it's a "no questions in this draft" state. Also
  matches the sibling `no-current-form-empty-state.tsx` suffix
  pattern under `form-versions-list/components/empty-state/`.
- `draft-editor/components/question/question-sheet.tsx` →
  `question-form-sheet.tsx`. The sheet hosts the question form;
  the longer name disambiguates from `question-card`,
  `question-list`, `question-form` in the same folder.

**Outstanding fix:**

[src/app/(home)/forms/page.tsx:1](../../../src/app/(home)/forms/page.tsx#L1)
still uses the old local alias `FormsPageClient` for what is now
`FormVersionsPageClient`. Runtime-safe (default imports alias
locally) but inconsistent with every other call site. Rename the
local to `FormVersionsPageClient`.

#### Phase 2 of cleanup — pending

File-by-file simplification per [cleanup-plan.md §Phase 2](./cleanup-plan.md#phase-2--file-by-file-cleanup-no-behavior-change).
Ordered small-blast-radius first, big-util-refactor last:

1. Skeleton dedupe within each subfeature.
2. Comment + `<Fragment>` audit.
3. Drop the `try/catch` in `question-card.tsx` (conditional on
   verifying `usePutQuestionToDraftForm.mutateAsync` never throws,
   or until the codebase-wide `fetchXxx` hardening lands).
4. `question-form.tsx` CRUD branching inline.
5. Variable / helper renames (`move` → `swapWithSibling`, etc.).
6. `prerequisite-editor.tsx` + `prerequisite-predicate-row.tsx`
   readability pass.
7. `form-version-diff.ts` slimming, verified by hand-built fixture
   pairs (added / modified / reparented).

**Carried from the original plan (run alongside or after Phase 2):**

- Loading skeletons wired wherever an initial load occurs (verify
  versions list, draft editor, historical viewer, publish sheet).
- Every mutation surfaces failures via toast and preserves the
  user's in-progress edits — no navigation away on failure.
- A11y pass on the dialog, sheet, inline edit, and diff components.
  Focus rings visible, keyboard navigation end-to-end, screen-
  reader labels for the diff marker column.
- `npx tsc --noEmit && npx eslint && yarn format` clean on the
  whole touched set.

**Picked up during execution:**

- **`fetchXxx` hardening codebase-wide.** Each `fetchXxx` should
  return `{ ok: false, error: { kind: 'network' } }` on `fetch` /
  `response.json()` throw rather than letting it bubble. Fixes the
  perpetually-loading state on back-then-forward navigation. See
  the deferred-decision entry for the longer write-up.
- **Per-modified-question split (optional).** Reformat the
  field-change panel inside `diff-question-card.tsx` as a two-
  column `Was | Now` block at sheet widths above some breakpoint.
  Retains the unified tree but gives a localised split feel where
  detail is densest. About 20 lines across
  `diff-question-card.tsx` + `diff-scalar-change.tsx`. Worth doing
  only if the unified field-change row reads as cramped in
  practice.
- **Filter chips on the diff.** "All / Modified / Added / Removed"
  toggle above the diff list, lets reviewers scan a large diff for
  one category. Cheap (filter the rendered `questionDiffs` array)
  and useful for big forms. Worth doing only if the diff is hard to
  scan with manual exercise.

**Verification target:**

After commit 12, manually exercise the full set of PRD use cases
against `Default Surveillance Form v1.0.6`:

- Versions list renders current / draft / previous in the documented
  order.
- Uganda-program empty state appears for `programId === 1`.
- Question CRUD (add, edit, delete, reorder, follow-up) saves
  automatically and surfaces toasts on failure.
- Delete on a depended-on question is blocked with the dependent
  list.
- Prerequisite editor restricts operators by referenced question
  type, shapes the value input correctly, renders the live preview.
- Question with `not` or nested-group prereq renders view-only.
- Historical viewer's diff renders added / removed / modified /
  unchanged / reparented correctly. Post-checkout revisit reads as
  all-unchanged (similarity matching working).
- Publish sheet's diff renders against current published. First-
  publish state shows the friendly card. Already-used version name
  blocks publish. On success: toast + redirect to `/forms` + the
  new version appears as current.

---

## Conventions

These are the standards established as we built commits 1–5 and refined
through review. Apply them to every new file unless the conversation
explicitly overrides one.

### Implementation rules (apply to every commit)

These rules govern how the work is done, not what it produces. They
hold across every commit, every file, every iteration. If a pattern
elsewhere in this document would violate one of these rules, the rule
wins.

- **Descriptive variable names.** Every identifier must convey what
  it holds. Use `prerequisiteExpression`, not `value`; `predicateValue`,
  not `v`; `referencedQuestion`, not `q`; `firstReferencableQuestion`,
  not `first`. If a reader has to consult the type to understand the
  variable, the name is wrong. This applies to props, locals, callback
  parameters, and destructured pieces.
- **Minimal implementation.** Build only what the current step
  requires. No speculative scaffolding, no "we'll probably want X
  later," no helper layers waiting for a second consumer, no flag-
  guarded experimental code paths. Three similar lines beats a
  premature abstraction. When the diff stays small, the system stays
  legible.
- **No direct file changes when producing code for review.** Code
  for the active commit is presented in the response and applied by
  the user. Direct edits are reserved for documentation updates
  (this file, ADRs) and for narrowly scoped fix-up requests the user
  explicitly authorizes.
- **No intermediate types outside the main domain models.** The
  contract schemas under `src/api/<resource>/contracts/` are the only
  named data shapes. Components and utilities operate directly on
  those types — no "editor models," no `EditorPrerequisite`, no
  flattened intermediate views. React-state pieces stay as primitive
  destructured fields without naming the composite. Component props
  interfaces are fine; they describe a component's surface, not a
  reusable data shape.
- **Utility functions only when absolutely necessary.** A util in
  `src/features/<feature>/utils/` earns its place only when the
  alternative is real duplication across multiple files. The
  established bar: ~3 call sites across ≥2 files of non-trivial
  logic (see `getDefaultValueForPredicate`,
  `getOperatorsUsedOnQuestion`). A 3-line helper used once is
  inlined. A helper used twice within a single file is inlined or
  expressed as a closure inside the consuming function. No
  speculative utilities, no `parse`/`serialize` pairs, no factory
  functions, no module-level helpers defined inside component files.
- **No overengineering.** If the natural expression is a 5-line
  inline computation, that is the expression. If the natural
  expression is a 15-line cross-file switch, that earns a util.
  Nothing in between gets abstracted. Premature flexibility (options
  parameters, hooks-as-props, generic wrappers) is rejected by
  default and only added when the second real consumer materializes.

### Architecture (project-wide)

- Data flow is **server function → BFF route → TanStack Query hook**.
  No shortcuts. Client components never call upstream APIs directly.
- All API responses wrapped in `Result<T, NetworkError>`. **No `try/catch`
  in the UI layer.**
- Validate all external data with Zod; derive TypeScript types via
  `z.infer`.
- Server components by default. `'use client'` only when interactivity
  is required.

### Contracts — `src/api/<resource>/contracts/`

- **Verbose, endpoint-specific filenames**:
  `get-forms-by-program-id-schema.ts`,
  `publish-draft-form-for-program-schema.ts`. Not `get-forms-schema.ts`.
- **Type exports at the bottom** of each file, after all schemas.
- **`…SuccessPayload = …ResponseBody`** alias on every endpoint
  contract.
- **Relative imports for siblings** (`./form-question-schema`); `@/`
  alias for cross-module imports.
- **Recursive schemas use the Zod 4 getter pattern**:
  `get subQuestions() { return z.array(formQuestionSchema).optional(); }`.
  Avoid `z.lazy` + manual type declaration.
- **`.partial()`** for PUT request schemas where the upstream accepts
  partial updates.
- **No `.coerce` on JSON request bodies.** Reserve `z.coerce.*` for
  query params and HTML form data, where input is string-only.

### Server functions — `src/api/<resource>/<verb>-<name>.ts`

- One file per endpoint. Function name matches filename.
- Signature: `accessToken` first, then path params, then `requestBody`.
- Explicit return type: `Promise<Result<…, NetworkError>>`.
- Body-bearing functions (`POST`, `PUT`) safeParse the body and
  short-circuit with `err({ kind: 'client' })` on failure.
- `GET` / `DELETE` skip body parsing.

### BFF routes — `src/app/api/...`

- **No Zod schemas for path params.** `Number((await params).foo)` for
  numeric path params; direct use for string path params.
- **Query params** still safeParsed in the route via Zod.
- **`interface RouteParams { params: Promise<{ ... }> }`** declared
  once per route file.
- **`authorized…Result`** naming for `withAuthSession<T>` results.
- **Single-arg arrow without parens** in the `withAuthSession`
  callback: `accessToken => fn(accessToken, …)`.
- **Body validation lives in the server function**, not the route. The
  route only does `await request.json()` + try/catch on parse failure.
- Bad numeric path params produce `NaN` → upstream 404. No upfront
  check needed.

### Query keys — `src/api/<resource>/<resource>-keys.ts`

- Object literal with `as const` tuples.
- `root: ['<resource>'] as const` always present.
- Scoped keys nest the scope param early to enable prefix-invalidation:
  `['forms', programId, 'current']`, `['forms', programId, 'draft']`.
- The bare prefix may double as a query key when it corresponds to a
  meaningful list query (e.g. `formsByProgramId(programId)` =
  `['forms', programId]` is both the list-versions key and the
  per-program invalidation prefix).

### Query hooks — `src/api/<resource>/hooks/use-get-<name>.ts`

- Types: `XxxQueryResult = Result<XxxSuccessPayload, NetworkError>`,
  `XxxQueryOptions = Omit<UseQueryOptions<…>, 'queryKey' | 'queryFn'>`.
- Extracted `async function fetchXxx(...)` does `fetch('/api/…')` with
  `credentials: 'include'`.
- Response body typed directly as the QueryResult (no schema
  re-validation — BFF already validated).
- Hook accepts an optional `options` parameter and spreads it into
  `useQuery`. **Queries DO accept options** because `enabled`,
  `staleTime`, `select` are intrinsic per-instance config.

### Mutation hooks — `src/api/<resource>/hooks/use-<verb>-<name>.ts`

- **No `options` parameter, no `MutationOptions` type.** Hook owns
  invalidation; callers attach success-side behaviour per-call via
  `mutate(vars, { onSuccess, onError })`. Both fire — TanStack runs
  hook-level and per-call callbacks.
- Local helper named with a **semantic verb** (not HTTP verb):
  `updateXxx` for PUT, `createXxx` for POST-create,
  `removeXxx` / `deleteXxx` for DELETE. POST actions that read as
  semantic verbs (`publish…`, `checkout…`) keep that name.
- `data.ok` guard in `onSuccess` — `fetchXxx` helpers never throw;
  failed responses come back as `Result<…, NetworkError>` with
  `data.ok === false`. Without the guard, invalidation fires on network
  failure.
- Cross-module invalidation is fine: form-question hooks import
  `formKeys` from `@/api/form/form-keys` to invalidate the draft cache.

### Feature utilities — `src/features/<feature>/utils/`

- Pure functions over contract types. No React, no hooks, no side
  effects.
- **Operate directly on contract types.** When a wire shape would
  normally be unpacked into an "editor model" intermediate type, prefer
  a pair of read helpers (`get…Connector`, `get…Predicates`) and a
  write helper (`build…`) over a `parse`/`serialize` pair backed by a
  named intermediate. The contract is the source of truth; UI
  components hold the disassembled fields as separate React state
  without naming a type for the composite.
- Variable naming:
    - **`branch`** for children of prerequisite expression trees.
    - **`questionToMove`** / **`swapPartner`** for ordering operations.
    - **`referencedQuestion`** for prerequisite targets.
    - **`targetQuestionId`** when identifying a question by id at a
      function boundary.
- **Domain constants stay hard-coded.** Dynamism is for varying inputs;
  mapping an operator token to its English label has no input — that's
  a constant.
- **No precomputed lookup caches** unless profiling justifies them. For
  the 10–50 questions and 1–5 lookups per call typical here, a small
  recursive finder beats a Map precomputation — asymptotic cost is the
  same and the code is simpler.

### Components

- **One component per file.** No same-file sub-components. Each
  component is its own file with `export default`. Local helper
  *functions* (e.g. a date formatter) are fine; local component
  definitions are not.
- **Only the page-level entry lives at the root of `components/`.**
  Everything else lives in a purpose-named subfolder. Categories used
  so far:
    - `layout/` — page shells, headers, structural wrappers.
    - `loading/` — skeletons.
    - `errors/` — error banners.
    - `empty-states/` — full-state empty/blocked UI.
    - `<feature-list>/` — feature-specific composites (e.g.
      `form-versions-list/`, future `draft-editor/`,
      `historical-viewer/`).
- **Combine where granularity exceeds reuse value.** A single-use
  card or row rendered inside one parent stays inline in the parent
  (as JSX, not as a same-file sub-component). Extract to its own file
  only when the piece is reused, when the prop surface is complex
  enough to warrant a typed interface, or when it's used inside a
  `.map()` and inlining hurts scan-ability.
- **Server components by default.** `'use client'` only when the
  component owns local state, an effect, or a TanStack hook. Leaf
  presentational components inherit client treatment from their
  importing parent — don't add `'use client'` defensively.
- **Mutually recursive components** for question tree rendering.
  Don't flatten for display — the wire shape is a tree; components
  walk it.
- Indentation + left border on nested children creates visual
  hierarchy. Same card shape at every depth — the hierarchy lives in
  the layout, not the card chrome.
- Sort `subQuestions` by `order` at the rendering site (defensive).
- shadcn primitives composed directly; never wrap them in pass-through
  components.

#### Page composition

- **Page shell at the server route entry.** A page-level component
  (e.g. `FormsPageShell`) owns the h1, the outer max-width container,
  and a fixed page description. It wraps the client entry in the
  server `page.tsx` so the h1 paints before hydration. The shell is
  composed exactly once per route, not at every state variant.
- **State variants are pure bodies.** Skeletons, error banners,
  empty states, and the active list render only body content — no
  h1, no outer container. The shell sits above them.
- **Page-level description is fixed**, not state-dependent. Pick a
  description that reads truthfully across loading / error / empty /
  success. State-specific copy lives in the variant itself (e.g. an
  empty state's title + description).
- **Section-localized error UI.** Each section that fetches data
  owns its own loading / error / success state machine and surfaces
  failures via `<FormErrorBanner>` inside the section. Errors live
  where the failure is — matching the AWS console / GitHub pattern.
  Never degrade silently for a fetch failure; the user needs the
  signal to retry.
- **Sibling fetching sections.** When a parent composes multiple
  data-fetching subsections, prefer sibling section components that
  each own their own queries over a stateful parent passing results
  down. Dual subscriptions to the same query key are cheap — TanStack
  dedupes the request and shares cache state, so a single retry
  reconciles every subscribed component.
- **Best-effort cross-section filters.** When a section's *secondary*
  data (used to filter or annotate, not as primary display) is
  loading or errored, skip the filter / annotation rather than
  bubbling another error. The section showing the primary failure is
  the source of truth for the user's retry action; double-reporting
  the same underlying error is noise.
- **Result envelope is the only error contract.** TanStack query
  `data.ok === false` means a `NetworkError`. `fetchXxx` helpers
  never throw, so `query.error` / `query.isError` never fire — always
  discriminate on `result.ok`.
- **Never use a fetch failure as a domain gate.** Conflating
  "current form fetch errored" with "this is a legacy program" blocks
  legitimate flows (a brand-new dynamic program would never get to
  publish its first version). Domain gates use explicit domain
  inputs — for the legacy/dynamic split that means
  `programId === UGANDA_PROGRAM_ID` until migration completes.
- **Banner over toast for load failures.** A page-level or
  section-level load failure is a state the user must read and act
  on; a banner persists and offers Retry. Toasts are reserved for
  transient post-action feedback.

### UI design

The bar is the polish of mature dev-tool products — GitHub, Linear,
Stripe. The builder is an admin tool used by non-engineers, so it has
to feel sturdy, learnable in one sitting, and never punish a mistake.

- **Typography is the primary hierarchy device.** Page heading, section
  heading, body, and metadata each have distinct size and weight — not
  just "bigger text." Headings carry meaning; secondary metadata
  (timestamps, version strings, ids) stays muted.
- **Spacing on the 8px grid.** Use Tailwind's spacing scale
  (`gap-2`, `gap-4`, `p-6`, `space-y-6`). Avoid one-off pixel values
  and ad-hoc margins.
- **Group with restraint.** Subtle borders (`border border-border`) and
  muted backgrounds (`bg-muted/50`) beat heavy cards or shadows.
  Hierarchy lives in spacing, not chrome. The same card shape works at
  every depth — nesting expresses itself through indentation, not
  visual weight.
- **Quiet palette, loud accents.** Neutral surfaces by default;
  semantic color (success / warning / destructive) reserved for status
  badges and confirmations. At most one bright primary action per view.
- **Skeletons match the layout.** Loading states are placeholders for
  the eventual shape, not generic spinners. The page should never blink
  blank or reflow on first paint.
- **Empty states explain the next step.** A blank list says nothing;
  "No published versions yet — publish your draft to see it here" tells
  the admin what to do. The legacy-program empty state owes the same
  honesty.
- **Destructive actions are quiet, deliberate, and reversible-feeling.**
  Use the destructive button variant, confirm in a dialog, surface the
  consequence in plain language ("This will permanently delete the
  question. 3 other questions depend on it and will break."). Never
  hide the destructive action behind an icon-only button.
- **Focus states must stay visible.** shadcn primitives ship with
  reasonable focus rings — do not override them away. The builder
  needs to be keyboard-navigable end to end.
- **Inline editing for single-field changes** (the form name in the
  draft editor header). **Drawers for multi-field flows** (add /
  edit question, prerequisite editor, publish review) — they keep
  context visible while editing or reviewing. **Modals for short
  confirmations** (delete a question, replace draft on checkout).
  Publish was originally a modal; it became a sheet in commit 11
  once it gained the pre-publish diff — review content doesn't fit
  in a centred modal.
- **Live previews where the user is composing structure.** The
  prerequisite editor's natural-language sentence updates as the user
  edits; it is the contract between the user's intent and the rule
  that will run.

#### Prop surfaces

- **Pass the fields a component renders, not the whole entity.** A
  `<QuestionCard>` takes a `FormQuestion` and the actions it can
  fire, not the whole `Form`. A `<PublishedFormVersionRow>` takes a
  single `Form`, not the array.
- **Domain objects in, primitive callbacks out.** Children invoke
  callbacks rather than receiving mutation hooks or query results
  directly. Keeps presentational components free of TanStack
  dependencies.

### Naming

| Type                 | Example                                                |
| -------------------- | ------------------------------------------------------ |
| React component      | `FormVersionsList`, `FormVersionsSection`, `CurrentVersionSection`, `DraftVersionSection`, `PreviousVersionsSection`, `FormsPageShell`, `FormErrorBanner`, `UgandaProgramEmptyState`, `PreviousVersionsEmptyState`, `NoCurrentFormEmptyState`, `FormVersionsListSkeleton` |
| Page component       | `FormsPage` (server shell), `FormsPageClient` (client entry) |
| Server function      | `getCurrentFormByProgramId`, `publishDraftFormForProgram` |
| BFF route handler    | `GET`, `POST` inside `route.ts`                        |
| TanStack Query hook  | `useGetDraftFormByProgramId`, `usePostQuestionToDraftForm` |
| Query keys           | `formKeys`, `formKeys.draftByProgramId(programId)`     |
| Zod schema           | `formQuestionSchema`, `publishDraftFormForProgramRequestSchema` |
| Type from schema     | `FormQuestion`, `PublishDraftFormForProgramRequestBody` |
| Utility function     | `findDependentQuestions`, `swapAdjacentSiblings`, `describePrerequisite`, `buildPrerequisite` |
| Feature folder       | `form-builder`                                         |

### Code standards

- Don't add features beyond the task. No premature abstractions.
- **No comments unless WHY is non-obvious.** Don't explain WHAT — the
  identifiers already do that.
- Trust internal code. Validate at boundaries only (user input,
  external APIs).
- Always **read the current file state before editing**. Don't assume
  it matches an earlier version from this conversation.
- Three similar lines is better than a premature abstraction.

---

## Deferred decisions

Discussed but pushed out of the current feature scope:

- **Global mutation error handler** (`MutationCache` on the
  QueryClient). Would centralise error toasts. Deferred — for now,
  callers handle per-call via `mutate(vars, { onError })`.
- **Optimistic updates.** Not in v1; invalidate-and-refetch instead.
- **Mutation hook `options` parameter.** Removed for v1; can be added
  back non-breaking when a real need emerges.
- **Composing `OPERATORS_BY_QUESTION_TYPE`** from named operator
  groups. Flat table at 5 types × 12 operators is more scannable;
  revisit if scale grows.
- **`EditorPrerequisite` intermediate type.** Dropped in commit 6 in
  favour of read/write helpers (`getPrerequisiteConnector`,
  `getPrerequisitePredicates`, `buildPrerequisite`) over
  `PrerequisiteExpression` directly. Editor components hold
  `connector` and `predicates` as separate React state — the contract
  remains the only named shape.
- **Shared `flatten-form-questions` helper.** Considered for commit 6
  as a single tree walker used by all utility modules. Dropped because
  each consumer walks for a different reason and the recursion is
  short enough to inline per module.
- **Legacy detection via `/current` fetch error** (per the original
  PRD). Discarded in commit 7 because it conflates a network failure
  with a domain state and would block a newly-migrated dynamic
  program from publishing its first version. Replaced with an
  explicit `programId === UGANDA_PROGRAM_ID` gate. Remove the
  constant when Uganda migrates.
- **Generic `LEGACY_PROGRAM_ID` name.** Rejected in favour of the
  specific `UGANDA_PROGRAM_ID` so the gate reads as the temporary
  hack it is, not as a permanent abstraction.
- **Silent degradation of section fetch failures.** Originally
  rejected per-section error UI; reversed in commit 7. Section-
  localized banners with Retry are now the convention (see Page
  composition). Errors live where the failure is; silent fallback
  hid real problems and gave the user no way to recover.
- **Leaf-composed page shell.** Originally `<FormsPageShell>` wrapped
  every state variant inside the client; reversed in commit 7. The
  shell now lives in the server `page.tsx` so the h1 paints SSR-
  first. The "description varies by state" argument did not hold —
  a single fixed description reads truthfully across all states, and
  state-specific copy lives in the variant body.
- **Stateful `<FormVersionsList />` fetching both queries.** The
  plan had the list component fetch current + list and inline three
  cards/rows. Reversed in commit 7 — the parent is a thin composer
  and three sibling section components each own their own queries
  and state machines. Dual subscriptions to `/current` are
  intentional (TanStack dedupes the request) and let the previous-
  versions section piggyback on the shared cache for filtering.
- **`format-published-date` util.** Considered for commit 7 to share
  the unix-seconds → display formatter. Dropped because `date-fns`
  is already in the project and a four-line wrapper failed the
  "three similar lines beats premature abstraction" test. `format(…)`
  inlined at the two call sites.
- **Codebase-wide `fetchXxx` hardening.** The convention says
  `fetchXxx` helpers never throw, so `query.error` / `query.isError`
  never fire — discriminate only on `result.ok`. In practice every
  current `fetchXxx` lets `fetch` and `response.json()` throw,
  putting TanStack in error state with `data: undefined` when those
  fail (back/forward nav abort, network drop, non-JSON response).
  The bug surfaces as a perpetually-loading page after browser
  back-then-forward, because the component check
  `!data || isPending` matches the error state too. Fix is to wrap
  each `fetchXxx` body in try/catch and return
  `{ ok: false, error: { kind: 'network' } }` on throw, then
  simplify the section/page checks to use `isPending` only. Deferred
  to a single dedicated commit so the cleanup is codebase-wide
  rather than piecemeal; commit 7 components keep the
  `!data || isPending` check until then. A specific Next.js App
  Router + TanStack interaction is the second-most-likely culprit
  for the back-button bug if the `fetchXxx` fix doesn't resolve it.
- **Cross-operator semantic conflict detection for visibility-rule
  predicates.** Commit 9 prevents two predicates with the same
  `(questionId, operator)` pair within a single rule, but it does
  not detect contradictions across *different* operators on the same
  question. Two known unhandled cases:
  - **Empty/value contradictions**: `Q1 has been answered AND Q1 is
    empty` (`not_empty` + `empty`), or `empty` combined with any
    value-bearing operator on the same question. Always contradictory
    under the ALL connector regardless of values.
  - **Range overlap contradictions**: `Q1 less than 3 AND Q1 greater
    than 5` — non-overlapping ranges leave no satisfying answer.
    Detecting these requires value-aware comparison across
    `gt`/`gte`/`lt`/`lte`, plus similar checks for `eq` against
    ranges, `eq` against `in`/`not_in`, and so on.
  - Two implementation paths were on the table: **(a)** restrict to
    one predicate per question (eliminates every same-question
    conflict in one shot but loses range queries like
    `Q1 gt 5 AND Q1 lt 10`), or **(b)** implement value-aware conflict
    detection across the operator pairs that can semantically
    conflict. Both deferred — the partial fix from commit 9 catches
    the most common case (exact-duplicate predicates) and the v1 PRD
    doesn't explicitly require comprehensive semantic conflict
    checking. Revisit when a user reports a conflict that the
    operator-uniqueness filter doesn't catch.
- **Diff view between two form versions.** Originally excluded by
  the PRD's Out of Scope. Brought back in scope as commit 11 by
  executive decision after commit 10 landed. The historical viewer
  is now diff-based; the read-only-question-list plan is shelved.
  The PRD's Out of Scope section is left as-is for the audit trail;
  this entry is the canonical record of the re-scoping.
- **Reorder detection inside the diff.** A question whose `order`
  changed within its parent's children but is otherwise unchanged
  is treated as `unchanged` by `diffFormVersions` in v1. Detecting
  reorders cleanly requires deciding which neighbours count
  (immediate predecessor only? full sequence?) and produces
  cascade-like noise when a single delete shifts every subsequent
  sibling. Reparenting (`parentId` change) IS detected and
  surfaced as a `modified` question with a `parent` field change,
  because depth/structure changes are semantically louder than
  same-parent reorders. Revisit when a user complains.
- **Diff-embedded checkout sheet.** Considered for commit 11 as an
  alternative to the small checkout-confirm-dialog from commit 10
  — a wider `Sheet` (side panel) hosting the diff inline with a
  destructive confirm at the bottom, matching the GitHub PR-creation
  pattern. Dropped because the diff is already on the historical
  viewer page behind the small confirm; double-rendering it adds
  scroll fatigue without new information. Revisit if checkout is
  exposed from a surface that does *not* already show the diff
  (e.g., a "checkout this version" link from the versions list).
- **Prerequisite-rename cascade.** Commit 11 compares prerequisite
  `questionId` references by resolving them to the referenced
  question's *label* (so post-publish/checkout id rotation doesn't
  flag every dependent as changed). The trade-off: when a referenced
  question is genuinely renamed (e.g., "Date of birth" → "DOB"), the
  question itself shows the label change, and every dependent also
  shows a `prerequisite` field change because the resolved label
  text differs. Arguably correct — the dependent's prereq display
  *does* change — but it's noisy. The cleaner fix is a global
  matching map (toId ↔ fromId) populated in a pre-pass and consulted
  by the comparison functions, which would make the comparison
  id-aware without relying on label text. Deferred because the
  current cascade is acceptable and the pre-pass adds ~50 lines.
  Revisit if users complain about the cascade noise.
- **Side-by-side (split) diff view.** Considered as a polish item
  for commit 12. Dropped from the polish scope. Tree-structured
  diffs don't split cleanly into two columns — alignment breaks
  whenever one side has a denser subtree, and the sheet's
  `max-w-3xl` width forces aggressive label truncation at half-
  width. The unified view already conveys the same information
  density via the per-field `Was: / Now:` rows inside modified
  questions. Smaller-scope polish path that retains the split feel:
  reformat the per-modified-question field-change panel as a two-
  column `Was | Now` block at wider sheet widths (≈20 lines in
  `diff-question-card.tsx` + `diff-scalar-change.tsx`). That's a
  commit-12 polish candidate; full tree-level split is deferred
  indefinitely.

---

## Verification (per commit)

After every commit:

```
npx tsc --noEmit
npx eslint <changed paths>
```

After commit 12, manually exercise the documented PRD use cases against
a program seeded with `Default Surveillance Form v1.0.6`.
