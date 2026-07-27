# Site activation is set per Site and cascaded, not derived from leaves

## Status

accepted

## Applies to

The Site Builder's activation model — the pure toggle-cascade and pending-change
diff utilities, and the staged activation UI that consumes them (row toggles,
the pending-changes bar, and the save confirmation).

## Context & Decision

A Site carries its own `isActive`, and the domain rule the app must uphold is
that **collection is never switched on somewhere unreachable**: an active Site
under an inactive ancestor is meaningless, because the inactive ancestor implies
the whole branch is off.

The original design expressed that rule by making activity **leaf-driven**: a
human would toggle only _leaf_ Sites and every interior Site's state would be
**derived** — active iff at least one active leaf sat beneath it. That framing
did not survive contact with how trees are actually built, for two reasons.

**Leafness has no stable definition here.** Read as "a Site at the bottom
Level", leafness depends on the program's Location Type list — which is
program-global and whose _bottom_ is precisely the editable part (only the
unoccupied tail may be inserted into or deleted from). Appending one Level
reclassifies every existing bottom Site from leaf to interior in a single
action, program-wide, including in trees the actor cannot see. It is also
undefined for a Site with no Location Type, which the Site contract permits.
Read instead as "a Site with no children", leafness becomes a property that
flips as the tree grows: a District is a leaf until its first SubCounty is
created, at which moment its state stops being something a human set and becomes
something derived from a child that — by the create-inactive rule — is inactive.

**Derivation and incremental building conflict.** Sites are created top-down and
always inactive, so a half-built tree is routine: a District exists, its
SubCounties do not yet. Under any derived model, such a branch has no leaf to
toggle, so nothing in it can be switched on until the tree reaches full depth.
Worse, derivation is not the identity on existing data. A District that is
active today derives _inactive_ the moment its first child appears, so simply
opening the builder would stage a deactivation the user never asked for — of a
Site that may hold collected data.

**Decision.** Every accessible Site owns its `isActive` and every accessible
Site is directly toggleable. Nothing is derived. The rule is upheld by two
cascades applied when a toggle is staged:

- **Activate** a Site → that Site **and its ancestor path** become active
  (up-cascade).
- **Deactivate** a Site → that Site **and its whole subtree** become inactive
  (down-cascade).

The invariant this maintains is that the set of active Sites is
**ancestor-closed**: no active Site sits under an inactive one, by construction.
"Leaf" survives as domain vocabulary for the deepest built Site — the real
collection point — but it is not a concept the model computes or depends on. Two
states are therefore legal that a derived model forbade: an active Site whose
children are all inactive (collection is on at that Site only — exactly what a
half-built branch means), and an active Site that keeps its state when a new
inactive child is added beneath it.

**Activation is staged and reconciled at save**, unlike create and rename, which
are immediate point actions. A toggle only edits a draft; a single Save
reconciles it against the server. This is deliberate:

- A cascade is a **multi-Site** edit. Committing per toggle would fire one
  confirmation per keystroke-scale action, or — worse — none at all, silently
  deactivating a subtree.
- One Save means **one honest confirmation** that can state the real blast
  radius: how many Sites are being activated, how many deactivated, and how many
  of them hold collected data (`hasData` **informs, never blocks**).
- The draft is the **identity on load**: it is seeded from the server's own
  `isActive` values, so an untouched builder reports zero pending changes.
- The commit is **ordered so every prefix of it leaves a valid tree**:
  deactivations first, deepest Site first; then activations, shallowest Site
  first. Sequential `PUT`s stop at the first failure, so a partial commit still
  leaves an ancestor-closed tree, and the retained draft still describes the
  intended end state for a retry.

The model runs **only over `canAccessSites`**, which is the whole accessible
subtree and the builder's sole data source. The topmost accessible Site of a
branch is treated as that branch's root: the up-cascade stops there rather than
walking into ancestors the actor was not granted. Those ancestors are read-only
context — only their names are known, via the Location Hierarchy, never their
`isActive`.

## Considered alternatives

- **Leaf-driven derivation** (the original design). Rejected for the two reasons
  above: no stable definition of a leaf, and derivation stages changes the user
  never made on any tree that is not built to full depth.
- **Independent per-node toggles with no cascade.** Simplest to implement, and
  it also survives incremental building. Rejected: it permits an active Site
  under an inactive ancestor, which is the one state the domain says is
  meaningless, and it pushes the work of keeping a branch coherent onto the
  user, one row at a time.
- **Immediate mutation per toggle.** Consistent with how create and rename
  behave. Rejected: a cascade is a multi-Site write, so this either confirms
  repeatedly or not at all, and a failure mid-cascade leaves a half-reconciled
  tree with nothing left on screen describing what was intended.
- **A backend-owned cascade** (`PUT` one Site, let the server deactivate the
  subtree). Airtight and atomic, and it would make the frontend model
  unnecessary. Rejected: no backend changes are in scope, and today's endpoint
  updates a single row.

## Consequences

- The activation model needs no Location Type data at all — only the Sites and
  their `parentId` links. Editing Levels can no longer change what is
  activatable.
- An active Site with no active children is representable and expected. Any
  read-out of "is this branch collecting?" must therefore look at the Site's own
  `isActive`, not infer it from descendants.
- Server states that violate ancestor-closure (reachable today only by raw API
  calls) are **not** silently repaired. The draft mirrors the server until the
  user toggles something; a cascade then fixes whatever it touches. Loading the
  builder never stages a change on its own.
- Confined to `canAccessSites`. The **partial-access-ancestor** case — a
  mid-level manager activating a Site whose out-of-access ancestor is inactive —
  is **deferred**: the up-cascade cannot reach that ancestor, so the resulting
  server state can violate ancestor-closure above the grant. Same residual-risk
  posture as ADR 0001, and inert under today's single `privilege === 3` tier,
  where accessible roots are program roots.
- A mid-batch save failure leaves a partially reconciled tree. It stays
  ancestor-closed by the commit ordering above, the draft is retained, and the
  user is told the save did not fully persist.
