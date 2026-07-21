# Form answer scope is immutable; unit identity is an inherited subtree

## Status

accepted

## Applies to

The form builder's question authoring — answer-scope selection, the unit
identity toggle, the visibility-rule (prerequisite) editor, and the draft
publish gate. Look for `// see ADR 0002` at the identity/scope derivation, the
prerequisite target filter, and the publish validation.

## Context & Decision

Dynamic Form questions carry an **answer scope** (`answerScope`): a `SESSION`
question is answered once per Session; a `SESSION_UNIT` question is answered once
per **Session Unit** (a trap/room within one visit). A Session Unit has **no
intrinsic identity fields**, so its `SESSION_UNIT` answers flagged
`isUnitIdentityComponent: true` — the **Unit Identity** — are what match "the
same" unit across Sessions in review. The builder must let admins author both
scopes and designate identity, without letting them create a form the review
layer cannot use. The backend already accepts both fields (optional on the
wire); this ADR governs the **authoring model** on the frontend.

We made five coupled decisions:

1. **Scope is immutable after creation.** A question's scope is fixed by the
   section it is created in and can never be edited; there is no cross-scope
   move. To change scope, the admin deletes the tree and recreates it in the
   other section.
2. **Identity is toggled only on a root and inherited down the whole subtree.** A
   follow-up is an identity component iff its root is — no per-follow-up toggle,
   no "identity islands". This makes **branch-specific composite identity**
   possible (an identity root with options A/B and branch follow-ups C, D / E
   yields units keyed AC / AD / BE).
3. **An identity root may not have a visibility rule.** Nesting (`parentId`) and
   visibility (`prerequisite`) are independent axes — a root is not inherently
   always-present. Barring a rule on identity roots guarantees every unit reaches
   an always-present identity; descendants branch freely. Only identity roots are
   constrained; non-identity roots keep the freedom to be conditional.
4. **Identity components are always required, and a unit-form needs ≥1 of them.**
   `required` is locked on for identity questions. The ≥1-identity rule is
   enforced by an inline backstop (the last remaining identity toggle can't be
   switched off) plus a client-side publish gate.
5. **Prerequisites never cross scope.** A visibility rule may reference only
   same-scope questions. The asymmetric relaxation (letting a `SESSION_UNIT`
   question depend on a `SESSION` answer — well-defined, since a session answer
   is shared by every unit) is **deferred** until a real form needs it; a
   `SESSION` question depending on a `SESSION_UNIT` answer stays permanently
   forbidden ("which unit's answer?").

## Considered alternatives

- **A full cross-scope scope-change cascade** (recursively re-scope the subtree,
  clear identity, prune now-invalid prerequisites) — rejected: high complexity
  and partial-failure risk across N mutations. Immutable scope + delete/recreate
  is far simpler for a rare operation.
- **Root-only identity** (follow-ups can never be identity) — rejected: it loses
  branch-specific composite identity, so two distinct units collapse to the same
  key and — with one form per unit — one is lost.
- **Per-question identity with islands** (an identity follow-up under a
  non-identity parent) — rejected: an island rooted at a conditional question can
  leave some units with an empty, ungroupable identity.
- **Asymmetric prerequisites now** (`SESSION_UNIT` may depend on `SESSION`) —
  deferred: no observed form needs it, and strict same-scope is easy to relax
  later without data migration.

## Consequences

- Changing a question's scope is delete-and-recreate; the scope selector lives
  only in the add flow, never the edit sheet. Accepted friction for a rare edit.
- The review/reconciliation layer may rely on: every unit has a **non-empty**
  identity tuple; identity tuples **vary by branch**; identity components are
  **required-when-visible**. Changing any of these later would ripple into
  review, which is why they are recorded here.
- Backward compatibility: every pre-existing question is `SESSION` /
  non-identity; both fields default accordingly when the backend omits them.
- If the asymmetric-prerequisite case appears in a real form, revisit decision 5
  (relax only the `SESSION_UNIT` → `SESSION` direction).
