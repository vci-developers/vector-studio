# VCV-209 — Implementation Plan

Companion to [VCV-209-form-builder.md](VCV-209-form-builder.md). The PRD answers
*what* and *why*; this document answers *how* and *in what order*.

The work ships as one PR on branch `VCV-209`, split into twelve commits so the
diff stays readable and each commit is independently sensible to revert.

---

## Architectural fit

The builder slots into the existing three-layer pattern with no new
infrastructure:

- **Backend Resource Layer** — a new `form` resource module under
  [src/api/form/](src/api/form/) mirroring the structure of
  [src/api/program/](src/api/program/) and [src/api/user/](src/api/user/):
  contracts, server functions, query keys, hooks.
- **Routing Layer** — three pages under `src/app/(home)/forms/` and a tree of
  BFF route handlers under `src/app/api/programs/[programId]/forms/`.
- **Feature Layer** — a new `form-builder` feature under
  `src/features/form-builder/` holding components and pure utility modules
  specific to the builder UI.

Data flow follows the existing pattern exactly: client component →
TanStack Query hook (`useGet…` / `usePost…`) → BFF route → server function →
upstream API. No client-side direct calls to the upstream API, no try/catch in
UI — everything wrapped in `Result<T, NetworkError>`.

---

## Key decisions

These are the resolved decisions that the rest of the plan assumes. Each one
has a corresponding section in the PRD with the longer rationale.

- **Single program per user.** `programId` is read from
  `useGetUserPermissions().data.data.programId` in client components and from
  `getUserPermissions(accessToken).data.programId` in server components. URLs
  are not parameterised by `programId`.
- **Legacy vs dynamic gate.** Decided at runtime by whether
  `GET /programs/{programId}/forms/current` succeeds. On error, the versions
  list renders the legacy-program empty state instead of the list. No
  country allowlist anywhere in the frontend.
- **Prerequisite wire format.** Predicates and group expressions are bare
  objects discriminated structurally (`'questionId' in expr`, `'all' in expr`,
  `'any' in expr`, `'not' in expr`). No synthetic `kind` field. The wire
  shape is verified against the running backend's `Default Surveillance Form
  v1.0.6` payload and matches the mobile app's
  `FormQuestionPrerequisiteEvaluator`.
- **No optimistic updates.** Mutations invalidate the relevant query keys and
  the affected form is refetched. The recursive tree makes client-side
  reconciliation more error-prone than the refetch is slow.
- **Reorder via two PUTs.** Up/down arrows swap `order` between adjacent
  same-parent siblings as two sequential `PUT /questions/{id}` calls. On
  second-PUT failure, the draft is refetched and a toast surfaces.
- **Toast library.** `sonner` via the shadcn wrapper at
  [src/components/ui/sonner.tsx](src/components/ui/sonner.tsx). `<Toaster />`
  mounted once in the root layout.
- **No tests.** v1 has no test runner; correctness is established by manual
  exercise of the builder against the documented use cases.

---

## Commit plan

### Commit 1 — shadcn primitives ✅ done

Adds the building blocks the rest of the feature needs:
`dialog`, `sheet`, `sonner`, `badge`, `switch`, `skeleton`, `dropdown-menu`,
`textarea`, `tooltip`. Mounts `<Toaster />` and `<TooltipProvider>` in
[src/app/layout.tsx](src/app/layout.tsx). No feature logic — clean baseline
for the rest of the commits to build on.

### Commit 2 — Form domain contracts

Creates [src/api/form/contracts/](src/api/form/contracts/) with thirteen
files: shared base schemas
(`form-question-type-schema`, `prerequisite-expression-schema`,
`form-question-schema`, `form-schema`) plus one schema file per endpoint
(`get-forms`, `get-current-form`, `get-form-by-version`, `publish-form`,
`checkout-form`, `put-form`, `post-question`, `put-question`,
`delete-question`).

Recursive schemas (`prerequisiteExpressionSchema`, `formQuestionSchema`) use
the canonical `z.ZodType<T>` + `z.lazy` pattern: TS type declared
explicitly, schema validates at runtime. All non-recursive types are
inferred via `z.infer`.

No network code in this commit; it is pure Zod and pure types.

### Commit 3 — Server functions

One file per endpoint under [src/api/form/](src/api/form/):
`get-forms.ts`, `get-current-form.ts`, `get-form-by-version.ts`,
`publish-form.ts`, `checkout-form.ts`, `put-form.ts`, `post-question.ts`,
`put-question.ts`, `delete-question.ts`.

Each function takes `accessToken` plus the path/body params it needs,
constructs the upstream URL under `/programs/{programId}/forms[…]`, and
delegates to `safeApiCall` with the appropriate response schema. Signature
mirrors [getPrograms](src/api/program/get-programs.ts) and
[getUserPermissions](src/api/user/get-user-permissions.ts).

### Commit 4 — BFF routes

Mirrors the API surface listed in the PRD under
`src/app/api/programs/[programId]/forms/`:

- `route.ts` — `GET` (list versions), `PUT` (rename)
- `current/route.ts` — `GET`
- `[version]/route.ts` — `GET` (the literal `"draft"` is passed through)
- `[version]/checkout/route.ts` — `POST`
- `publish/route.ts` — `POST`
- `questions/route.ts` — `POST`
- `questions/[questionId]/route.ts` — `PUT`, `DELETE`

Each handler reads `params` (Next.js gives them as strings), parses them
plus the request body via Zod, wraps the server function call in
`withAuthSession`, and returns
`NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 })`.

Path-param Zod schemas (`programIdPathSchema` coercing string→number, and a
shared `formVersionPathSchema`) are introduced in this commit since this is
the first feature that needs them.

### Commit 5 — Query keys and TanStack hooks

`src/api/form/form-keys.ts` exposes a single `formKeys` factory scoped by
`programId`:

- `root`
- `byProgram(programId)`
- `allVersions(programId)`
- `currentForm(programId)`
- `draft(programId)`
- `version(programId, version)`

`src/api/form/hooks/` contains one file per hook:

- Queries: `use-get-forms`, `use-get-current-form`,
  `use-get-form-by-version`, `use-get-draft-form` (the draft hook hits the
  by-version route with the literal `"draft"` but keys cache by the
  `draft(programId)` key).
- Mutations: `use-publish-form`, `use-checkout-form`, `use-put-form`,
  `use-post-question`, `use-put-question`, `use-delete-question`.

Invalidation policy per PRD: `publish` invalidates the all-versions,
current-form, and draft keys; everything else invalidates only the draft
key.

### Commit 6 — Builder utilities

Pure functions over the contract types, no React, no hooks. Live under
`src/features/form-builder/utils/`:

- `prerequisite.ts` — `parsePrerequisite` (wire tree → flat editor model),
  `serializePrerequisite` (flat model → wire tree), `isPrerequisiteEditable`
  (any `not` or any nested group → false), `describePrerequisite`
  (natural-language preview), `operatorsForQuestionType` (filters operators
  by the type of the referenced question), and the `OPERATOR_LABELS` mapping
  (`eq` → "is", `gte` → "is at least", `empty` → "is empty", etc.). The
  operator set and behaviour matches the mobile evaluator exactly.
- `question-dependencies.ts` — `findDependents(questionId, draft)` walks
  every question's prerequisite expression and returns the questions that
  reference the given id. Powers the delete blocker.
- `question-order.ts` — `nextOrderFor(parentId, draft)` returns the next
  global `order` for a newly-added root or subquestion;
  `swapAdjacentSiblings(questionId, direction, draft)` produces the pair of
  `{ id, order }` updates for an up/down reorder.
- `flatten-questions.ts` — internal helper used by the three modules above
  to walk the recursive tree once.

These are the "natural seams to test" called out in the PRD's testing
section. We do not add tests now but the modules are factored so tests can
be added later without restructuring.

### Commit 7 — Versions list page

Routes:

- `src/app/(home)/forms/page.tsx` — server component, renders
  `<FormsPageClient />`.

Components under `src/features/form-builder/components/versions-list/`:

- `forms-page-client.tsx` — orchestrator. Reads `programId` from
  `useGetUserPermissions`, calls `useGetCurrentForm` and `useGetForms`. If
  `useGetCurrentForm` errors, renders `<LegacyProgramEmptyState />`;
  otherwise renders `<VersionsList />` with the current form pinned at top,
  the draft as the primary CTA, and previous published versions
  chronologically below.
- `current-version-card.tsx`, `draft-version-card.tsx`,
  `published-version-row.tsx`, `legacy-program-empty-state.tsx`,
  `versions-list-skeleton.tsx`.

Navigation: clicking the draft card goes to `/forms/draft`, clicking a
published row goes to `/forms/{version}`.

### Commit 8 — Draft editor: shell, rename, question CRUD

Routes:

- `src/app/(home)/forms/draft/page.tsx` — server component, renders
  `<DraftEditorClient />`.

Components under `src/features/form-builder/components/draft-editor/`:

- `draft-editor-client.tsx` — top-level client component; holds the
  `useGetDraftForm` query and composes the children.
- `form-name-inline-edit.tsx` — click-to-edit field that calls
  `usePutForm` on confirm.
- `question-list.tsx` and `question-card.tsx` — recursive renderer for the
  question tree. Card surfaces up/down arrows, add-follow-up, edit, and
  delete affordances.
- `question-drawer.tsx` — shadcn `Sheet` for add and edit flows; embeds
  `question-form.tsx`.
- `question-form.tsx` — react-hook-form + Zod resolver, mirrors the
  auth-form pattern in [src/features/auth/](src/features/auth/). Captures
  label, type, required, and options. Prerequisite UI is stubbed in this
  commit (read-only "Always show") and filled in by commit 9.
- `options-editor.tsx` — add, edit, reorder, remove dropdown options.
- `delete-question-dialog.tsx` — runs `findDependents` first. If the list
  is non-empty, becomes an explanation dialog listing the dependents with
  the confirm button disabled. Otherwise a simple confirm.
- `draft-editor-skeleton.tsx`.

Reorder fires two sequential `PUT`s using the payloads from
`swapAdjacentSiblings`. On second-PUT failure, the draft is refetched and a
toast surfaces.

### Commit 9 — Prerequisite editor

Splits out under
`src/features/form-builder/components/draft-editor/prerequisite/`:

- `prerequisite-editor.tsx` — top-level. Calls `isPrerequisiteEditable`. If
  the existing prerequisite is editable, renders the authoring UI; if not
  (any `not` or nested group), renders a "Complex rule — view only" badge
  with `describePrerequisite` as the read-only summary, plus a short
  explanation pointing the user at a form administrator.
- `connector-toggle.tsx` — single shadcn `Switch` between "ALL conditions
  must match" and "ANY condition must match". Default ALL.
- `predicate-row.tsx` — question picker (drawn from the draft tree),
  operator dropdown, and value input.
- `operator-select.tsx` — operator list filtered by the referenced
  question's type via `operatorsForQuestionType`. Labels from
  `OPERATOR_LABELS`. Raw tokens never shown to the user.
- `value-input.tsx` — renders the value input shape based on the referenced
  question's type and the chosen operator: a Yes/No toggle for boolean,
  the question's own options as a dropdown for select, a numeric input for
  number, a date picker for date, a text input for text, and a chip-style
  multi-value input for `in` / `not_in`.
- `prerequisite-preview-sentence.tsx` — live `describePrerequisite` output,
  updates as the editor changes.

Integrates into `question-form.tsx` from commit 8, replacing the stub.

### Commit 10 — Publish and checkout dialogs

- `publish-dialog.tsx` — shadcn `Dialog` opened from the draft editor's
  header. Requires an explicit version string, validates non-empty and
  not-already-used (checks the `useGetForms` cache), displays the latest
  published version for reference, calls `usePublishForm` on confirm. On
  success, navigates back to `/forms` with a success toast.
- `checkout-confirm-dialog.tsx` — opened from the historical viewer. Plain-
  language warning that the draft will be replaced. On confirm, calls
  `useCheckoutForm` and navigates to `/forms/draft`.

Wires the publish button into the draft editor header.

### Commit 11 — Historical viewer

Routes:

- `src/app/(home)/forms/[version]/page.tsx` — server component, renders
  `<HistoricalViewerClient version={...} />`. The `"draft"` segment is
  handled by the sibling `draft/page.tsx`, so this route never sees it.

Components under `src/features/form-builder/components/historical-viewer/`:

- `historical-viewer-client.tsx` — calls `useGetFormByVersion`, renders
  the read-only question list, and surfaces the "Check out" CTA that opens
  `checkout-confirm-dialog.tsx`.
- `read-only-question-list.tsx`, `read-only-question-card.tsx` — recursive
  read-only renderer. No edit affordances. Prerequisite renders as the
  `describePrerequisite` sentence regardless of editability.
- `historical-viewer-skeleton.tsx`.

### Commit 12 — Polish pass

- Confirm loading skeletons are wired everywhere an initial load occurs.
- Confirm every mutation surfaces failures via a toast and preserves the
  user's in-progress edits (no navigation away on failure).
- A11y pass on the dialog, sheet, and inline edit components.
- `yarn typecheck && yarn lint && yarn format` clean.

---

## Verification

Per the PRD's testing section, correctness is established by manual
exercise. After each commit, run:

```
yarn typecheck
yarn lint
```

After commit 12, manually exercise the documented PRD use cases against a
program seeded with `Default Surveillance Form v1.0.6`:

- Versions list renders the current form, the draft, and the published
  history in the documented order.
- Legacy empty state appears when `/current` errors.
- Question add, edit, delete, reorder, and follow-up flows all save
  automatically and surface toasts on failure.
- Delete on a depended-on question is blocked with the dependent list.
- Prerequisite editor restricts operators by referenced question type,
  shapes the value input correctly, and renders the live preview sentence.
- A question with a `not` or nested group prerequisite renders as
  view-only.
- Publish creates a new version, returns to the list, and the new version
  appears as the current form.
- Checkout from a historical version replaces the draft and navigates to
  the editor.

---

## Out of scope

See the PRD's [Out of Scope section](VCV-209-form-builder.md). Headline
exclusions: no `not`/nested-group authoring, no drag-and-drop, no
duplicate/import/export, no per-question help text, no undo, no diff view,
no multi-program switching, no sidebar shell, no location-hierarchy
authoring, no automated tests, no backend changes.
