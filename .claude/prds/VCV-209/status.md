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
| 7.5| Design-language pass (interim)          | pending           |
| 8  | Draft editor (shell, rename, CRUD)      | pending           |
| 9  | Prerequisite editor                     | pending           |
| 10 | Publish + checkout dialogs              | pending           |
| 11 | Historical viewer                       | pending           |
| 12 | Polish + consistency cleanup            | pending           |

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
  project; `format(new Date(createdAt * 1000), 'MMM d, yyyy')` is
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

### Commit 7.5 — design-language pass (pending)

Interim polish pass between commit 7 and commit 8. The functional
versions list is in, but the visual language is generic
shadcn-template aesthetic — rounded-xl cards with rings, uppercase
muted section labels, dashed-border empty states, no hover
treatment on the current-version card. Goal of this pass is to set
the design language *once* so commits 8–11 inherit it and commit
12 becomes consistency cleanup rather than redesign.

**Reference quality bar:** GitHub, Linear, Vercel dashboards.
Sturdy, learnable in one sitting, never punishes a mistake. Quiet
palette, loud accents. Typography is the primary hierarchy device;
chrome is restrained.

**Scope of the pass:**

1. **Unify section visual language.** Today current/draft cards
   use `rounded-xl` card chrome with a ring, and the
   previously-published list uses divided rows in a bordered
   container — two visual languages on the same page. Collapse to
   one: either every version is a row in a single list (current
   marked Active, draft as a row with a primary CTA), or keep
   sections but apply the same row treatment within each.
2. **Section labels.** Drop uppercase muted h2 in favour of
   sentence-case semibold at a slightly larger weight — or omit
   labels entirely if the rows are self-descriptive (current's
   Active badge, draft's CTA).
3. **Card chrome density.** Replace shadcn's default
   `rounded-xl` + `ring-1` + `shadow-xs` with thin `border` only,
   no ring, no shadow. Grouping comes from spacing and subtle
   background contrast (`bg-muted/30` or similar), not chrome.
4. **Badge refinement.** Tighten the Active badge — size, tracking,
   palette alignment with the rest of the design system. Today's
   custom emerald is fine but slightly off-palette.
5. **Hover and focus.** Every navigable row/card gets a
   `hover:bg-muted/50` (or similar) + `focus-visible` treatment.
   Optionally a leading-edge accent. End-to-end keyboard navigation
   should feel as good as mouse.
6. **Skeletons match content shape.** Replace generic
   `h-24 w-full` rectangles with placeholders that mirror the
   eventual row (title bar + caption + badge slot). No reflow on
   first paint.
7. **Empty-state visual language.** Move away from dashed borders.
   Lean on neutral surfaces + icon + tight spacing, in line with
   the rest of the design.
8. **Typography rhythm.** Tighten heading leading/tracking;
   normalise description color stop; standardise body vs metadata
   sizes across components. One table of typographic intents,
   applied consistently.
9. **Iconography.** Normalise icon sizes against text baselines.
   `size-3.5` / `size-4` / `size-5` used intentionally, not
   incidentally.

**Out of scope for the design-language pass:**

- New feature work or behavioural changes. This is a visual pass
  only.
- Reworking the underlying component decomposition. The
  three-sibling-sections shape stays; only its visual treatment
  changes.
- Animation work beyond simple `transition-colors` for hover.
- Dark-mode-specific design beyond what the existing tokens
  cover.

**How this changes the downstream commits:**

- Commits 8–11 build on the established design language.
  `<QuestionCard>`, `<QuestionDrawer>`, `<PrerequisiteEditor>`,
  the publish/checkout dialogs, and the historical viewer all
  inherit the spec set here.
- Commit 12 becomes "consistency cleanup" — audit every surface
  against the language, fix drift, finalise a11y. No design
  invention at commit 12.

**Open questions for the pass:**

- Sections + rows, or one unified list? Both are defensible;
  decide first thing in the pass and the rest falls into place.
- Section labels: keep, restyle, or drop? Tied to the above
  decision.
- Active badge: dot indicator, text badge, or both? Modern
  dashboards often use a small coloured dot + label rather than
  a pill.

---

## Conventions

These are the standards established as we built commits 1–5 and refined
through review. Apply them to every new file unless the conversation
explicitly overrides one.

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
  edit question, prerequisite editor) — they keep the question list
  visible underneath. Modals only for confirmations and publish.
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

---

## Verification (per commit)

After every commit:

```
npx tsc --noEmit
npx eslint <changed paths>
```

After commit 12, manually exercise the documented PRD use cases against
a program seeded with `Default Surveillance Form v1.0.6`.
