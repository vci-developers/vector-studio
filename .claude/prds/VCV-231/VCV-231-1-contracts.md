# VCV-231 · Step 1 — Contracts & Data Layer

> Slice 1 of 4. See [Step 0](./VCV-231-0-overview.md). Foundation for every later
> step. Assumes `.claude/CONTEXT.md` (Forms & Sessions) and ADR 0002.

## Problem Statement

The form-question contract describes a question as `{ label, type, required,
options, order, parentId, prerequisite }`. It has no **answer scope** or **unit
identity**, so the UI has no typed way to read or write whether a question is
answered per Session or per Session Unit, or whether it identifies a unit.
Nothing downstream can be built type-safely until the contract carries these
fields.

## Solution

Add `answerScope` and `isUnitIdentityComponent` to the question schema and to the
create/update request bodies. The backend returns both as optional (older
questions predate them), so the **response** schema defaults them — `SESSION` and
`false` — keeping every existing draft/version valid with no migration. Server
functions, BFF routes and hooks are already pass-through, so no other change is
needed.

## User Stories

1. As a developer, I want the question schema to include `answerScope`, so that I
   can read a question's scope type-safely.
2. As a developer, I want the question schema to include
   `isUnitIdentityComponent`, so that I can read whether a question identifies a
   unit.
3. As a developer, I want `answerScope` to be a narrow union (`'SESSION' |
   'SESSION_UNIT'`), so that impossible values are unrepresentable.
4. As a developer, I want the response schema to default `answerScope` →
   `SESSION` and `isUnitIdentityComponent` → `false` when omitted, so that
   pre-existing questions parse without error.
5. As a developer, I want the create-question body to accept both fields, so that
   the builder can author scope and identity.
6. As a developer, I want the update-question body to accept both fields, so that
   identity can be toggled and scope set during a draft rebuild.
7. As a developer, I want nested `subQuestions` to carry the same fields, so that
   follow-ups round-trip their inherited scope and identity.
8. As a developer, I want derived types to update from the schemas, so that the
   rest of the feature compiles against one source of truth.

## Implementation Decisions

- **`answerScope`**: Zod enum `['SESSION', 'SESSION_UNIT']` (matches the live
  backend enum). On the question **response** shape it is optional and defaults
  to `'SESSION'`; on request bodies it is sent explicitly.
- **`isUnitIdentityComponent`**: boolean; defaults to `false` on the response
  shape; sent explicitly on request bodies.
- **Backward compatibility via defaults** is the crux: a question object omitting
  both fields must parse to `SESSION` / `false`. No data migration.
- The shared question schema already self-references for `subQuestions`, so the
  new fields propagate to follow-ups automatically.
- **No enforcement here.** The contract permits any combination
  (`SESSION` + identity, etc.); the invariants live in the authoring UI (Steps
  2–3). This keeps the data layer a dumb, faithful mirror of the wire.
- **No server/BFF/hook edits.** Verified: `postQuestionToDraftForm` /
  `putQuestionToDraftForm` `safeParse` the request schema and forward it, and the
  hooks pass `requestBody` through — so widening the schema is sufficient.
- Follows existing schema-file naming, `…SuccessPayload` aliases and derived-type
  conventions — no new pattern.

## Files changed (3)

- [form-question-schema.ts](../../../src/api/form-question/contracts/form-question-schema.ts)
- [post-question-to-draft-form-schema.ts](../../../src/api/form-question/contracts/post-question-to-draft-form-schema.ts)
- [put-question-to-draft-form-schema.ts](../../../src/api/form-question/contracts/put-question-to-draft-form-schema.ts)

**Checkpoint:** `npm run typecheck` (the derived types ripple through every
consumer) + `lint` + `format`.

## Testing Decisions

- **No automated tests this round.** Confidence = typecheck + manual: load an
  existing draft built before this slice and confirm it still parses and renders
  unchanged (exercises the response default).
- The response-default behavior is pure schema behavior — the first thing to unit
  test once a runner exists.

## Out of Scope

- Any UI (Steps 2–4).
- Enforcing the scope/identity invariants — the contract stays permissive.
- Server/BFF/hook changes (pass-through) and backend changes (fields exist).

## Further Notes

- Verified live: `answerScope` (string enum, optional) +
  `isUnitIdentityComponent` (boolean, optional) on the question object and both
  request bodies.
- Land this first — a later contract correction would ripple through every step.
