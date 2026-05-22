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
| 6  | Builder utilities                       | 🔄 in progress    |
| 7  | Versions list page                      | pending           |
| 8  | Draft editor (shell, rename, CRUD)      | pending           |
| 9  | Prerequisite editor                     | pending           |
| 10 | Publish + checkout dialogs              | pending           |
| 11 | Historical viewer                       | pending           |
| 12 | Polish pass                             | pending           |

### Commit 6 — in flight

Pure utility functions under `src/features/form-builder/utils/`:

- [x] `flatten-form-questions.ts` — recursive tree walker
- [x] `form-question-dependencies.ts` — `findDependents` for the delete blocker
- [ ] `form-question-order.ts` — `nextOrderFor`, `swapAdjacentSiblings`
- [ ] `form-question-prerequisite.ts` — `parsePrerequisite`, `serializePrerequisite`, `isPrerequisiteEditable`, `describePrerequisite`, `operatorsForQuestionType`, `OPERATOR_LABELS`

When the four files are in place, run
`npx tsc --noEmit && npx eslint src/features/form-builder` to confirm
clean, then commit 6 closes.

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
- **One intermediate type maximum per module**. Reuse contract types
  everywhere else.
- Variable naming:
    - **`branch`** for children of prerequisite expression trees.
    - **`questionToMove`** / **`swapPartner`** for ordering operations.
    - **`allQuestions`** instead of `flat` for flattened lists.
    - **`referencedQuestion`** for prerequisite targets.
- **Domain constants stay hard-coded.** Dynamism is for varying inputs;
  mapping an operator token to its English label has no input — that's
  a constant.

### Components

- **Server components by default.** `'use client'` only when
  interactivity is required.
- **Mutually recursive components** for question tree rendering. Don't
  flatten for display — the wire shape is a tree; components walk it.
- Indentation + left border on nested children creates visual
  hierarchy. Same card shape at every depth — the hierarchy lives in
  the layout, not the card chrome.
- Sort `subQuestions` by `order` at the rendering site (defensive).
- shadcn primitives composed; feature-specific components live under
  `src/features/<feature>/components/`.

### Naming

| Type                 | Example                                                |
| -------------------- | ------------------------------------------------------ |
| React component      | `QuestionTree`, `VersionsList`, `PublishDialog`        |
| Page component       | `FormsPage`, `DraftEditorPage`                         |
| Server function      | `getCurrentFormByProgramId`, `publishDraftFormForProgram` |
| BFF route handler    | `GET`, `POST` inside `route.ts`                        |
| TanStack Query hook  | `useGetDraftFormByProgramId`, `usePostQuestionToDraftForm` |
| Query keys           | `formKeys`, `formKeys.draftByProgramId(programId)`     |
| Zod schema           | `formQuestionSchema`, `publishDraftFormForProgramRequestSchema` |
| Type from schema     | `FormQuestion`, `PublishDraftFormForProgramRequestBody` |
| Utility function     | `findDependents`, `swapAdjacentSiblings`, `describePrerequisite` |
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
- **Composing `OPERATORS_BY_TYPE`** from named operator groups. Flat
  table at 5 types × 12 operators is more scannable; revisit if scale
  grows.

---

## Verification (per commit)

After every commit:

```
npx tsc --noEmit
npx eslint <changed paths>
```

After commit 12, manually exercise the documented PRD use cases against
a program seeded with `Default Surveillance Form v1.0.6`.
