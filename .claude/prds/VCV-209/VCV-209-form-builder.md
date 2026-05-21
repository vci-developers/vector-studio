# VCV-209 — Dynamic Surveillance Form Builder

## Problem Statement

VectorStudio supports two kinds of surveillance forms: a legacy fixed-shape
`SurveillanceForm` (whose columns are hard-coded against Uganda's original
questions) and a new dynamic `Form` / `FormQuestion` / `FormAnswer` schema that
can adapt to any program's data-collection needs. Programs on the dynamic
schema currently have no way to manage their questions from the web app —
forms are seeded directly via backend tooling, which means every change to a
country's data-collection requirements requires engineering involvement and
slows iteration.

Program administrators need a self-service way to evolve their surveillance
form as field requirements change, without filing tickets or waiting on
engineers. The audience for this tool is country administrators, not technical
users; the UI has to be usable by someone who has never seen a JSON expression
tree.

## Solution

A web-based Form Builder, scoped to whichever single program the logged-in
user administers, that exposes the dynamic `Form` schema as a manageable
artefact:

- A versions list page summarising the currently-published form, the active
  draft, and previous published versions
- A draft editor for adding, editing, reordering, and deleting questions
  (including nested follow-up questions)
- A read-only viewer for any historical version, with the ability to "check
  out" that version back into the draft as a starting point for new edits
- A publish flow that names the draft (e.g. `v1.0.7`) and atomically makes it
  the program's active form (a single backend call handles both)
- A visibility-rule editor that lets admins say *"show this question when
  Q2 is Yes and Q8 is one of (HLC, PSC)"* using plain-language operator
  labels, with no exposure to the underlying JSON expression structure

The builder is shown only for programs on the dynamic schema. Programs still
on the legacy `SurveillanceForm` see an empty state explaining that the
builder is not yet available for their program. The legacy/dynamic
determination is made by attempting to fetch the program's currently
published dynamic form — if that call errors, the program is treated as
legacy.

## User Stories

1. As a program administrator, I want to see whether my program is on the
   dynamic form system, so that I know whether the form builder applies to
   me.
2. As a program administrator on the legacy schema, I want a clear explanation
   that the builder is unavailable for my program, so that I am not confused
   by a blank screen or missing nav.
3. As a program administrator, I want to see the currently published form
   highlighted at the top of the versions list, so that I always know which
   form my field workers are filling out right now.
4. As a program administrator, I want to see the working draft on the
   versions list and jump into editing it with one click, so that the most
   common action is the most prominent action.
5. As a program administrator, I want to see all previously published
   versions in chronological order with their publish dates, so that I can
   audit the form's history.
6. As a program administrator, I want to open any historical version in
   read-only mode, so that I can understand what fields were collected at a
   given point in time.
7. As a program administrator, I want to load a historical version into my
   draft ("check out"), so that I can use a past form as a starting point
   for new edits rather than rebuilding it from scratch.
8. As a program administrator, I want a confirmation step before a checkout
   replaces my current draft, so that I do not accidentally lose unsaved
   work.
9. As a program administrator, I want to rename the form, so that the
   in-app heading shown to field workers can match how my team refers to it.
10. As a program administrator, I want to add a new question to the draft,
    so that I can capture data my program has started collecting.
11. As a program administrator, I want to choose the question type from a
    short, named list (text, number, yes/no, dropdown, date), so that I do
    not need to understand database types.
12. As a program administrator, I want to mark a question as required, so
    that field workers cannot submit a session without answering it.
13. As a program administrator authoring a dropdown question, I want to add,
    edit, reorder, and remove the dropdown's options, so that I can shape
    the answer set without engineer involvement.
14. As a program administrator, I want to edit an existing question's text,
    type, requiredness, and options, so that I can refine wording or correct
    mistakes over time.
15. As a program administrator, I want to delete a question I no longer
    need, so that the draft stays focused on the data I actually collect.
16. As a program administrator, I want to be prevented from deleting a
    question that another question depends on, with a clear list of which
    questions depend on it, so that I do not silently break the form's
    visibility logic.
17. As a program administrator, I want to add a follow-up (subquestion)
    underneath an existing question, so that I can group conditionally
    relevant questions under their parent.
18. As a program administrator, I want to add follow-ups at any depth
    (follow-up under a follow-up), so that the form can express the same
    hierarchy that field workers already navigate.
19. As a program administrator, I want to reorder questions using up and
    down arrows, so that I can adjust flow without learning drag-and-drop.
20. As a program administrator, I want to mark a question as "shown only
    when…" certain other questions have certain answers, so that field
    workers only see questions relevant to the case they are recording.
21. As a program administrator authoring a visibility rule, I want the
    operator dropdown to use natural English ("is", "is not", "is at least",
    "has been answered"), so that I do not need to learn database
    expressions.
22. As a program administrator authoring a visibility rule, I want the
    operator choices to be filtered to the type of the referenced question
    (numeric comparisons only on number questions, etc.), so that I cannot
    construct an invalid rule.
23. As a program administrator authoring a visibility rule, I want the
    value picker to match the referenced question's shape (a Yes/No toggle
    for boolean questions, the dropdown's own options for select
    questions, a date picker for date questions), so that picking a value
    is unambiguous.
24. As a program administrator authoring a visibility rule with multiple
    conditions, I want a single, plain-language toggle to choose between
    "all conditions must match" and "any condition must match", so that I
    can combine clauses without learning boolean algebra.
25. As a program administrator authoring a visibility rule, I want a
    live preview sentence that restates the rule in natural language as I
    edit it, so that I can confirm I built the rule I intended.
26. As a program administrator opening a question that already has a
    visibility rule the editor cannot express (nested groups, negation), I
    want the editor to clearly mark it as view-only and direct me to
    contact a form administrator, so that I do not accidentally simplify or
    corrupt rules I do not fully understand.
27. As a program administrator, I want a single "Publish" action that
    captures the current draft as a new immutable version, so that I do not
    have to perform a separate "make this the current version" step.
28. As a program administrator publishing a draft, I want to name the
    version explicitly (e.g. `v1.0.7`), so that the version is meaningful
    rather than auto-generated.
29. As a program administrator publishing a draft, I want the publish
    dialog to remind me of the latest published version number, so that I
    can pick a sensible next version.
30. As a program administrator, I want to know that publishing is
    irreversible (a new version is created, the draft persists), so that I
    can publish with confidence.
31. As a program administrator, I want feedback that publishing succeeded
    and a clear next-step affordance, so that I can return to the versions
    list and see the result.
32. As a program administrator working in the draft editor, I want every
    action (add, edit, delete, reorder, rename) to save automatically when
    confirmed, so that I do not have a separate "save draft" button to
    remember.
33. As a program administrator, I want failed mutations to surface clearly
    without losing my place in the draft, so that I can retry without
    rebuilding the form mentally.
34. As a program administrator on a slow connection, I want loading
    states that look intentional (skeletons matching the eventual layout)
    rather than blank screens, so that I trust the page is working.
35. As an engineer maintaining the codebase, I want every form-related
    request to go through the same `safeApiCall` / `withAuthSession` /
    `Result` plumbing the rest of the app uses, so that the form domain
    does not invent new failure handling.
36. As an engineer maintaining the codebase, I want all form
    request/response shapes validated by Zod schemas that mirror the
    backend exactly (including the recursive question tree and the
    discriminated-union prerequisite type), so that the frontend never
    silently renders a corrupted form.
37. As an engineer maintaining the codebase, I want the legacy/dynamic
    distinction to be derived from API behaviour rather than a hard-coded
    country allowlist, so that the gate inverts automatically when
    additional programs (Uganda) migrate to the dynamic schema.

## Implementation Decisions

### Domain placement

- The forms resource is a backend resource and lives in the existing
  Backend Resource Layer alongside `program`, `site`, `user`. Server
  functions, hooks, and Zod contracts are colocated under a single
  `form` resource module that mirrors the structure of the existing
  resources.
- The form-builder UI lives in the Feature Layer under a `form-builder`
  feature. Components and any builder-specific utilities (rule
  parse/serialize, dependency lookup, order math) stay scoped to that
  feature and are not promoted to shared until a second consumer
  appears.
- App-router pages live under `(home)/forms` and are intentionally
  laid out so that a future sidebar shell can slot in at the layout
  level without moving any pages.

### Routing

- Pages are not parameterised by `programId`. The app's contract is
  one program per user, and `programId` is read at runtime from the
  permissions endpoint. URLs are simpler and the architecture remains
  open to a multi-program future without rewriting routes.
- Three pages cover the feature: a versions list, a draft editor, and
  a historical viewer parameterised by version string.
- The versions list page is also the gate: it attempts to fetch the
  current published form, and on error renders a legacy-program empty
  state rather than the list.

### Backend integration

- All upstream form endpoints documented in
  `.claude/docs/form-api-usecases.md` are exposed through dedicated BFF
  routes that follow the existing pattern (`withAuthSession`, Zod-parse
  inputs, `NextResponse.json` with `Result` envelope).
- The Server-function → BFF-route → TanStack-hook pattern is followed
  for every endpoint, with no shortcuts.
- The BFF route for publishing wraps a single upstream call; the
  backend handles "make this the current form" as part of publish, so
  the frontend does not orchestrate two calls.
- Path-parameter convention: the literal string `"draft"` in BFF URLs
  is passed through verbatim to the backend, which accepts it as a
  valid path segment. The empty-string convention in the database is
  not exposed to the frontend.

### API surface (BFF)

The BFF exposes the following routes (all scoped under
`/api/programs/{programId}/forms`):

- `GET /` — list all form versions
- `GET /current` — fetch the currently published form
- `GET /{version}` — fetch a specific form version (the literal
  `"draft"` returns the draft)
- `POST /publish` — publish the draft under a named version, and
  atomically set it as the program's current form
- `POST /{version}/checkout` — replace the draft with a copy of a
  named version
- `PUT /` — rename the form
- `POST /questions` — create a question in the draft
- `PUT /questions/{questionId}` — update a question in the draft
- `DELETE /questions/{questionId}` — delete a question from the draft

### Query keys and cache invalidation

- A single `formKeys` factory exposes keys scoped by `programId`: a
  root key, an "all versions" key, a per-version key, a draft key, and
  a current-form key.
- Mutation policy is invalidate-and-refetch on the affected keys; no
  optimistic updates in v1. The draft form is small enough that a
  refetch is fast and avoids reconciling a recursive tree client-side.
- Publish invalidates the all-versions, current, and draft keys.
  Checkout, rename, and question CRUD invalidate only the draft key.

### Zod contracts

- A single shared contract file holds the recursive `formQuestion`,
  `prerequisiteExpression`, and core `form` schemas. Endpoint-specific
  request/response schemas live in per-endpoint files following the
  existing convention.
- The `prerequisiteExpression` schema is a discriminated union over
  predicate, `all`, `any`, and `not` shapes, declared with `z.lazy`
  to support recursion. Operator values are constrained to the
  documented set (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`,
  `not_in`, `contains`, `not_contains`, `empty`, `not_empty`).
- The `formQuestion` schema is recursive (a question may contain
  `subQuestions`) and constrains `type` to the documented set
  (`text`, `number`, `boolean`, `select`, `date`).
- All TypeScript types for these contracts are inferred from the
  schemas rather than declared independently.

### Builder-specific utilities

Three small utility modules live under the feature folder:

- A prerequisite utilities module: converts between the editor's
  flat-AND/OR representation and the backend's recursive expression
  tree, classifies whether a given expression is editable by the v1
  editor (any `not` or any nested group → not editable), and
  generates the natural-language preview sentence.
- A question dependencies module: walks a draft tree and returns,
  for a given question id, the set of questions that reference it in
  any prerequisite expression. Powers the delete blocker.
- An order utilities module: computes the next global `order` for a
  newly-added root or subquestion, and produces the pair of `order`
  updates needed to swap two adjacent siblings.

These are plain functions over the contract types, not classes or
hooks.

### Form Builder UI patterns

- The versions list pins the currently-published form at the top,
  surfaces the draft as the primary CTA, then lists previous versions
  chronologically.
- Question CRUD opens a side drawer rather than a centred modal.
  Drawers keep the question list visible underneath and are more
  comfortable for longer forms.
- The form name appears in the draft editor header as an inline
  click-to-edit field, calling the rename endpoint on confirm. The
  versions list and historical viewer do not expose rename.
- Reordering uses up/down arrows that fire two sequential `PUT`s to
  swap `order` values with the adjacent same-parent sibling. On a
  second-PUT failure, the draft is refetched and a toast surfaces.
- Adding a subquestion is available at every level via an "Add
  follow-up question" affordance on each question card.
- Deletion runs the dependency check first. If any other question's
  prerequisite references this question, the delete modal becomes an
  explanation modal listing the dependents. Otherwise it is a
  simple confirm.
- Publish opens a modal that requires an explicit version string,
  shows the latest published version for reference, validates that
  the version is non-empty and not already used, and on success
  navigates back to the versions list with a toast.
- Checkout opens a confirm modal that is explicit about the draft
  being replaced, and on success navigates to the draft editor.

### Prerequisite editor (Option B — flat AND/OR)

- The editor models a prerequisite as either (a) a single predicate,
  (b) an `all` of predicates, or (c) an `any` of predicates. It does
  not model `not` or nested groups.
- The group connector is presented as a single toggle in natural
  English: "ALL conditions must match" vs "ANY condition must
  match". The default is ALL.
- Operator labels are presented in natural English (mapping table
  documented separately). The raw token (`eq`, `gte`, …) is never
  shown.
- The operator dropdown is filtered based on the type of the
  referenced question: numeric operators are only available when the
  referenced question is numeric; `contains` is only available when
  the referenced question is text; `is` and `is not` are universally
  available; `has been answered` and `is empty` are universally
  available.
- The value input is shaped by the operator and the referenced
  question: a Yes/No toggle for boolean references, the question's
  own options as a dropdown for select references, a numeric input
  for number references, a date picker for date references, and a
  chip-style multi-value input for list operators (`in`, `not_in`).
- A live preview sentence beneath the editor restates the current
  rule in natural language and updates as fields change.
- If a question is loaded whose existing prerequisite uses `not` or
  nested groups, the editor renders a read-only summary with a
  "Complex rule — view only" badge and a short explanation.
  Editing the rule from this state is disabled; the question's other
  fields remain editable.

### States

- Initial loads use skeletons that match the eventual layout.
- The legacy-program empty state is the rendered output when
  `/current` errors, and is plain-language ("The dynamic form
  builder is not yet enabled for your program.").
- Mutation errors surface as toasts and preserve the user's
  in-progress edits. The user is never returned to an empty editor
  on transient failure.

### Concurrency

- The backend exposes no version field or optimistic-concurrency
  check on the draft. Two concurrent admins on the same draft are
  last-write-wins. This is acceptable for v1 (single-administrator
  programs are the norm) and revisited if it becomes a real issue.

### Sidebar

- A sidebar shell is intentionally out of scope. The pages are
  arranged so that a future sidebar can be added at the `(home)`
  layout level without restructuring routes. Until then, the builder
  is reached by direct URL.

## Testing Decisions

Per the implementation discussion, no automated tests are in scope
for v1. The repository has no test runner configured today, and
adding one is out of scope for this ticket. Correctness will be
established through manual exercise of the builder against the
documented use cases and the existing example form
(`Default Surveillance Form v1.0.6`).

If testing is reintroduced later, the natural seams to test are the
three utility modules (prerequisite parse/serialize/classify/humanize,
question dependencies, order math), because they are pure functions
over the contract types and have a wide input space.

## Out of Scope

- Editing of prerequisite expressions that contain `not` or nested
  groups (these are rendered read-only in v1).
- A `not` operator in the v1 authoring UI. Users compose the common
  cases via `neq` / `not_empty` / `not_in`.
- Drag-and-drop reordering. Up/down arrows only.
- Duplicating a question, bulk import/export of questions, or
  copying questions across forms.
- Per-question help text or descriptions (the schema does not
  support a description field).
- Draft history or undo. The draft is mutable and last-write-wins.
- A diff view between two form versions.
- Authoring `prerequisite` logic at any depth beyond what Option B
  expresses.
- Multi-program switching. The app contract is one program per user.
- A sidebar shell or any new top-level navigation.
- Location-hierarchy authoring (deliberately separated into a future
  ticket).
- Automated tests, test infrastructure, or test scaffolding.
- Changes to the legacy `SurveillanceForm` table or any code path
  that reads or writes it.
- Backend changes of any kind. All endpoints used by the builder
  already exist on the backend.

## Further Notes

- The legacy/dynamic distinction is enforced as a frontend gating
  decision based on `/forms/current` behaviour. This means the
  invariant "a program is either dynamic or legacy, but never both"
  is load-bearing for the gate; the small edge case "dynamic
  program with no published version yet" would be misclassified as
  legacy. This is acceptable given the operational reality that
  dynamic programs always have at least one published version
  before the builder is offered to administrators.
- The mobile application's `FormQuestionPrerequisiteEvaluator`
  defines the canonical operator set and per-operator value-type
  expectations. The frontend's Zod schema and operator-filtering
  logic are designed to match the mobile evaluator exactly, so that
  any rule authored in the builder evaluates as the author expects
  in the field.
- The `order` field is global to the form, not scoped per parent.
  This is consistent with the existing example form (subquestions
  share the same monotonic sequence as root questions) and the
  reorder UX is designed accordingly: arrows swap adjacent same-
  parent siblings rather than treating each parent as its own
  ordering space.
- The publish endpoint's request body is a single `version` string.
  Auto-suggesting `v(n+1)` is intentionally deferred: forcing an
  explicit choice from the author is more transparent for non-
  technical users and avoids encoding a versioning convention the
  product has not formally adopted.
- All BFF and hook naming follows the conventions established in
  the existing `program`, `site`, and `user` resources: BFF route
  handlers expose standard HTTP verb exports, hooks use the
  `useGet…` / `usePost…` / `usePut…` / `useDelete…` prefixes, and
  query keys are exposed through a single factory per resource.
