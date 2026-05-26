# VCV-209 — Naming Audit & Utils Grooming

Companion to [cleanup-plan.md](cleanup-plan.md). The cleanup plan handled
structural tidying (phases 1–8, now complete). This document covers two
remaining concerns that aren't addressed there:

1. **Naming audit** — every identifier in the feature that doesn't convey its
   intent clearly, with proposed renames.
2. **Utils grooming** — complete rewritten versions of every utils file, with
   section headers, single-line JSDoc signatures, and the renames applied.

> **Important:** nothing in this document changes behaviour. All changes are
> naming-only or editorial (sections, signatures).
>
> Do NOT apply these files directly — review each proposed rename first and
> apply via a single Phase 10 commit, running `tsc --noEmit` after each file.

---

## Part 1 — Naming Audit

### A. Component files

#### `prerequisite-node-editor.tsx:57` — `groupParts`

```ts
const groupParts = getPrerequisiteGroupParts(nodeExpression);
```

**Issue.** "Parts" is too vague — parts of what? `getPrerequisiteGroupParts`
returns `{ connector, childExpressions }` when the expression is an `all`/`any`
group node, or `null` for predicates. The word "parts" doesn't describe that
unwrapping operation. The variable is immediately destructured on the next line,
which further obscures the intermediate name's purpose.

**Proposed renames (linked — must be applied together):**

| Site                                                             | Before                                                                | After                                                            |
| ---------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `prerequisite.ts:52` (function definition)                       | `getPrerequisiteGroupParts`                                           | `parseGroupExpression`                                           |
| `prerequisite.ts:88` (call in `simplifyPrerequisiteExpression`)  | `const groupParts = getPrerequisiteGroupParts(...)`                   | `const group = parseGroupExpression(...)`                        |
| `prerequisite.ts:205` (call in `describePrerequisiteExpression`) | `const groupParts = getPrerequisiteGroupParts(...)`                   | `const group = parseGroupExpression(...)`                        |
| `prerequisite-node-editor.tsx:12` (import)                       | `getPrerequisiteGroupParts`                                           | `parseGroupExpression`                                           |
| `prerequisite-node-editor.tsx:57` (call)                         | `const groupParts = getPrerequisiteGroupParts(...)`                   | `const group = parseGroupExpression(...)`                        |
| `prerequisite-node-editor.tsx:59` (destructure)                  | `const { connector: groupConnector, childExpressions } = groupParts;` | `const { connector: groupConnector, childExpressions } = group;` |

---

#### `prerequisite-predicate-row.tsx:49` — `conflictingOperatorsOnCurrentQuestion`

```ts
const conflictingOperatorsOnCurrentQuestion = referencedQuestion
    ? getOperatorsAlreadyUsedOnQuestion(...)
    : [];
```

**Issue.** "Conflicting" implies logical conflict between operators. These
operators are not in conflict with each other — they are simply already claimed
by sibling predicates, so the current predicate row can't use them again. The
utility that produces them is named `getOperatorsAlreadyUsedOnQuestion`, which
uses the right word.

**Proposed rename:**

| Site                                | Before                                  | After                                   |
| ----------------------------------- | --------------------------------------- | --------------------------------------- |
| `prerequisite-predicate-row.tsx:49` | `conflictingOperatorsOnCurrentQuestion` | `operatorsAlreadyUsedOnCurrentQuestion` |

---

#### `question-order.ts:49,53` — `swapPartnerIndex` / `swapPartner`

```ts
const swapPartnerIndex = direction === 'up' ? questionToMoveIndex - 1 : ...;
const swapPartner = siblingsSortedByOrder[swapPartnerIndex];
```

**Issue.** "Swap partner" is informal and describes the relationship from the
operation's perspective (we're swapping with it) rather than from the data
model's perspective (it is the adjacent sibling in sort order). The rest of the
function uses `questionToMove` / `questionToMoveIndex` as the primary subject;
the counterpart should mirror that register.

**Proposed renames:**

| Site                   | Before                                                | After                                                     |
| ---------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| `question-order.ts:49` | `swapPartnerIndex`                                    | `adjacentSiblingIndex`                                    |
| `question-order.ts:53` | `swapPartner`                                         | `adjacentSibling`                                         |
| `question-order.ts:54` | `!questionToMove \|\| !swapPartner`                   | `!questionToMove \|\| !adjacentSibling`                   |
| `question-order.ts:57` | `{ id: swapPartner.id, order: questionToMove.order }` | `{ id: adjacentSibling.id, order: questionToMove.order }` |

---

#### `options-editor.tsx:19` — `draftOption`

```ts
const [draftOption, setDraftOption] = useState('');
```

**Issue.** The word "draft" collides with the form-builder concept of the draft
form. This is not a draft-form option — it is the uncommitted text sitting in
the add-option input field before the user confirms it. Compare `pendingName` in
`form-name-inline-edit.tsx`, which uses the same uncommitted-state pattern with
the right word.

**Proposed rename:**

| Site                                        | Before                               | After                                  |
| ------------------------------------------- | ------------------------------------ | -------------------------------------- |
| `options-editor.tsx:19` (state declaration) | `draftOption, setDraftOption`        | `pendingOption, setPendingOption`      |
| `options-editor.tsx:22`                     | `draftOption.trim()`                 | `pendingOption.trim()`                 |
| `options-editor.tsx:24`                     | `setDraftOption('')`                 | `setPendingOption('')`                 |
| `options-editor.tsx:127`                    | `value={draftOption}`                | `value={pendingOption}`                |
| `options-editor.tsx:128`                    | `setDraftOption(event.target.value)` | `setPendingOption(event.target.value)` |
| `options-editor.tsx:142`                    | `draftOption.trim().length === 0`    | `pendingOption.trim().length === 0`    |

---

#### `question-form.tsx:107` — `normalizedOptions`

```ts
const normalizedOptions = values.type === 'select' ? values.options : null;
```

**Issue.** "Normalized" suggests a data transformation (e.g. trimming,
deduplication). What actually happens: options are set to `null` for non-select
question types before being sent to the API, because the backend only accepts
options for `select` questions. The qualifier "for request" is precise.

**Proposed rename:**

| Site                                  | Before                        | After                         |
| ------------------------------------- | ----------------------------- | ----------------------------- |
| `question-form.tsx:107` (declaration) | `normalizedOptions`           | `optionsForRequest`           |
| `question-form.tsx:136` (use)         | `options: normalizedOptions,` | `options: optionsForRequest,` |

---

### B. Utils functions

#### `prerequisite.ts:52` — `getPrerequisiteGroupParts` → `parseGroupExpression`

Covered above in the component section (§A, first item) since the rename
propagates to three component call sites.

---

#### `form-version-diff.ts:82` — `matchedFromByToQuestion`

```ts
const matchedFromByToQuestion = new Map<FormQuestion, FormQuestion>();
```

**Issue.** This is a `Map` keyed by `toQuestion` whose value is the matched
`fromQuestion`. The phrase "matchedFromByToQuestion" reads as "matched from-by-
to-question," which sounds like the match direction is from→to. The key actually
goes the other way: you look up by `toQuestion` to get the `fromQuestion`. Phase
8 correctly rejected `matchedFrom` (drops the indexing direction). A rename that
preserves the direction while clarifying the key/value order:

**Proposed rename:**

| Site                                     | Before                                                                | After                                        |
| ---------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| `form-version-diff.ts:82` (declaration)  | `matchedFromByToQuestion`                                             | `fromQuestionByToQuestion`                   |
| `form-version-diff.ts:122` (`.set`)      | `matchedFromByToQuestion.set(matchedToQuestion, matchedFromQuestion)` | `fromQuestionByToQuestion.set(...)`          |
| `form-version-diff.ts:129` (`.get`)      | `matchedFromByToQuestion.get(toQuestion)`                             | `fromQuestionByToQuestion.get(toQuestion)`   |
| `form-version-diff.ts:165` (`.values()`) | `new Set(matchedFromByToQuestion.values())`                           | `new Set(fromQuestionByToQuestion.values())` |

---

#### `form-version-diff.ts:270` — `areQuestionReferencesLabelEquivalent`

```ts
function areQuestionReferencesLabelEquivalent(
    fromReferencedQuestionId: number | null,
    toReferencedQuestionId: number | null,
    ...
): boolean
```

**Issue.** "QuestionReferences" is a detour. The function takes two IDs from
separate form versions, resolves each against its respective question map, and
checks that both resolve to questions with matching labels. The name should say
what's being compared: question labels. It's used for parent-ID comparisons and
prerequisite-questionId comparisons — in both cases the question being asked is
the same: "do these two IDs point at questions with the same label?"

**Proposed rename:**

| Site                                                                        | Before                                                                 | After                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| `form-version-diff.ts:270` (definition)                                     | `areQuestionReferencesLabelEquivalent`                                 | `questionLabelsMatch`                                 |
| `form-version-diff.ts:241` (call in `computeFieldChanges`)                  | `areQuestionReferencesLabelEquivalent(fromQuestion.parentId, ...)`     | `questionLabelsMatch(fromQuestion.parentId, ...)`     |
| `form-version-diff.ts:299` (call in `arePrerequisiteExpressionsEquivalent`) | `areQuestionReferencesLabelEquivalent(fromExpression.questionId, ...)` | `questionLabelsMatch(fromExpression.questionId, ...)` |

---

## Part 2 — Groomed Utils Files

The following are complete, ready-to-apply versions of every utils file under
`src/features/form-builder/`. Each file has:

- Section headers that group related and dependent functions together
- A single-line `/** ... */` JSDoc above each function
- All renames from Part 1 applied
- No behaviour changes

Apply these files in order; run `tsc --noEmit` after each one.

---

### `src/features/form-builder/utils/walk-questions.ts`

```ts
import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';

/** Pre-order walk: visits each question before its subQuestions. Handles undefined gracefully. */
export function walkQuestions(
    questions: FormQuestion[] | undefined,
    visit: (question: FormQuestion) => void,
): void {
    if (!questions) return;
    for (const question of questions) {
        visit(question);
        walkQuestions(question.subQuestions, visit);
    }
}
```

---

### `src/features/form-builder/utils/question-type-labels.ts`

```ts
import type { FormQuestionType } from '@/api/form-question/contracts/form-question-schema';

/** Human-readable label for each question type, shown in the question-form type selector. */
export const QUESTION_TYPE_LABELS: Record<FormQuestionType, string> = {
    text: 'Short text',
    number: 'Number',
    boolean: 'Yes / No',
    select: 'Dropdown',
    date: 'Date',
};
```

---

### `src/features/form-builder/draft-editor/utils/question-dependencies.ts`

```ts
import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type { PrerequisiteExpression } from '@/api/form-question/contracts/prerequisite-expression-schema';
import type { Form } from '@/api/form/contracts/form-schema';
import { walkQuestions } from '../../utils/walk-questions';

// ── Prerequisite reference check ──────────────────────────────────────────────

/** Returns true if expression (or any of its descendants) references targetQuestionId in a predicate. */
function prerequisiteExpressionReferencesQuestion(
    expression: PrerequisiteExpression | null,
    targetQuestionId: number,
): boolean {
    if (!expression) return false;
    if ('questionId' in expression) {
        return expression.questionId === targetQuestionId;
    }
    if ('all' in expression) {
        return expression.all.some(branch =>
            prerequisiteExpressionReferencesQuestion(branch, targetQuestionId),
        );
    }
    if ('any' in expression) {
        return expression.any.some(branch =>
            prerequisiteExpressionReferencesQuestion(branch, targetQuestionId),
        );
    }
    return false;
}

// ── Dependent question lookup ─────────────────────────────────────────────────

/** Returns every question in draft whose prerequisite directly or indirectly references targetQuestionId. */
export function findDependentQuestions(targetQuestionId: number, draft: Form) {
    const dependentQuestions: FormQuestion[] = [];
    walkQuestions(draft.questions, question => {
        if (
            prerequisiteExpressionReferencesQuestion(
                question.prerequisite,
                targetQuestionId,
            )
        ) {
            dependentQuestions.push(question);
        }
    });
    return dependentQuestions;
}
```

---

### `src/features/form-builder/draft-editor/utils/question-order.ts`

Changes applied: `swapPartnerIndex` → `adjacentSiblingIndex`, `swapPartner` →
`adjacentSibling`.

```ts
import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type { Form } from '@/api/form/contracts/form-schema';
import { walkQuestions } from '../../utils/walk-questions';

// ── Next-order calculation ────────────────────────────────────────────────────

/** Returns max(order) + 1 across all questions in draft, used as the order for a newly-appended question. */
export function getNextQuestionOrder(draft: Form): number {
    let highestExistingOrder = 0;
    walkQuestions(draft.questions, question => {
        if (question.order > highestExistingOrder) {
            highestExistingOrder = question.order;
        }
    });
    return highestExistingOrder + 1;
}

// ── Sibling group lookup ──────────────────────────────────────────────────────

/**
 * Recursively searches the question tree to find the sibling array that
 * contains targetQuestionId. Returns null if the question is not found.
 */
function findSiblingGroup(
    targetQuestionId: number,
    candidateSiblingGroup: FormQuestion[] | undefined,
): FormQuestion[] | null {
    if (!candidateSiblingGroup) return null;
    if (
        candidateSiblingGroup.some(question => question.id === targetQuestionId)
    ) {
        return candidateSiblingGroup;
    }
    for (const question of candidateSiblingGroup) {
        const foundSiblingGroup = findSiblingGroup(
            targetQuestionId,
            question.subQuestions,
        );
        if (foundSiblingGroup) return foundSiblingGroup;
    }
    return null;
}

// ── Adjacent sibling swap ─────────────────────────────────────────────────────

/**
 * Computes the two { id, order } updates needed to move questionToMoveId one
 * step in direction within its sibling group. Returns null if the move is out
 * of bounds or the question is not found in draft.
 */
export function swapAdjacentSiblings(
    questionToMoveId: number,
    direction: 'up' | 'down',
    draft: Form,
): Array<{ id: number; order: number }> | null {
    const siblingGroup = findSiblingGroup(questionToMoveId, draft.questions);
    if (!siblingGroup) return null;

    const siblingsSortedByOrder = [...siblingGroup].sort(
        (a, b) => a.order - b.order,
    );
    const questionToMoveIndex = siblingsSortedByOrder.findIndex(
        question => question.id === questionToMoveId,
    );
    const adjacentSiblingIndex =
        direction === 'up' ? questionToMoveIndex - 1 : questionToMoveIndex + 1;

    const questionToMove = siblingsSortedByOrder[questionToMoveIndex];
    const adjacentSibling = siblingsSortedByOrder[adjacentSiblingIndex];
    if (!questionToMove || !adjacentSibling) return null;

    return [
        { id: questionToMove.id, order: adjacentSibling.order },
        { id: adjacentSibling.id, order: questionToMove.order },
    ];
}
```

---

### `src/features/form-builder/utils/prerequisite.ts`

Changes applied: `getPrerequisiteGroupParts` → `parseGroupExpression`; all three
internal call sites updated to use `group` instead of `groupParts`.

```ts
import type {
    FormQuestion,
    FormQuestionType,
} from '@/api/form-question/contracts/form-question-schema';
import type {
    PrerequisiteExpression,
    PrerequisiteGroupConnector,
    PrerequisiteOperator,
    PrerequisitePredicate,
    PrerequisiteValue,
} from '@/api/form-question/contracts/prerequisite-expression-schema';
import type { Form } from '@/api/form/contracts/form-schema';
import { walkQuestions } from './walk-questions';

// ── Look-up tables ────────────────────────────────────────────────────────────

/** Natural-language label for each operator token, shown in the predicate-row operator dropdown. */
export const PREREQUISITE_OPERATOR_LABELS: Record<
    PrerequisiteOperator,
    string
> = {
    eq: 'is',
    neq: 'is not',
    gt: 'is greater than',
    gte: 'is at least',
    lt: 'is less than',
    lte: 'is at most',
    in: 'is one of',
    not_in: 'is not one of',
    contains: 'contains',
    not_contains: 'does not contain',
    empty: 'is empty',
    not_empty: 'has been answered',
};

/** Natural-language label for each group connector, shown in the group connector dropdown. */
export const PREREQUISITE_GROUP_CONNECTOR_LABELS: Record<
    PrerequisiteGroupConnector,
    string
> = {
    all: 'ALL of these match',
    any: 'ANY of these match',
};

/** Ordered list of operators available per question type, used to filter the operator dropdown. */
export const PREREQUISITE_OPERATORS_BY_QUESTION_TYPE: Record<
    FormQuestionType,
    PrerequisiteOperator[]
> = {
    text: ['eq', 'neq', 'contains', 'not_contains', 'empty', 'not_empty'],
    number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'empty', 'not_empty'],
    boolean: ['eq', 'neq', 'empty', 'not_empty'],
    select: ['eq', 'neq', 'in', 'not_in', 'empty', 'not_empty'],
    date: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'empty', 'not_empty'],
};

// ── Group expression — parse and build ───────────────────────────────────────

/**
 * If expression is an `all` or `any` group node, returns its connector and
 * child expressions. Returns null for predicate nodes (`questionId` shape).
 */
export function parseGroupExpression(expression: PrerequisiteExpression): {
    connector: PrerequisiteGroupConnector;
    childExpressions: PrerequisiteExpression[];
} | null {
    if ('all' in expression) {
        return { connector: 'all', childExpressions: expression.all };
    }
    if ('any' in expression) {
        return { connector: 'any', childExpressions: expression.any };
    }
    return null;
}

/**
 * Builds an `all` or `any` group expression from a connector and children.
 * Returns null when childExpressions is empty (a zero-child group is meaningless).
 */
export function buildPrerequisiteGroup(
    connector: PrerequisiteGroupConnector,
    childExpressions: PrerequisiteExpression[],
): PrerequisiteExpression | null {
    if (childExpressions.length === 0) return null;
    return connector === 'all'
        ? { all: childExpressions }
        : { any: childExpressions };
}

// ── Expression normalization ──────────────────────────────────────────────────

/**
 * Recursively prunes null children and unwraps single-child groups. Returns
 * null for a null input or an expression that reduces to nothing after pruning.
 */
export function simplifyPrerequisiteExpression(
    prerequisiteExpression: PrerequisiteExpression | null,
): PrerequisiteExpression | null {
    if (!prerequisiteExpression) return null;
    if ('questionId' in prerequisiteExpression) return prerequisiteExpression;
    const group = parseGroupExpression(prerequisiteExpression);
    if (!group) return null;
    const simplifiedChildExpressions = group.childExpressions
        .map(childExpression => simplifyPrerequisiteExpression(childExpression))
        .filter(
            (childExpression): childExpression is PrerequisiteExpression =>
                childExpression !== null,
        );
    if (simplifiedChildExpressions.length === 0) return null;
    if (simplifiedChildExpressions.length === 1)
        return simplifiedChildExpressions[0]!;
    return buildPrerequisiteGroup(group.connector, simplifiedChildExpressions);
}

// ── Predicate defaults and availability ──────────────────────────────────────

/**
 * Returns the default predicate value for a new predicate on referencedQuestion
 * with operator. Returns undefined for presence-only operators (empty, not_empty).
 */
export function getDefaultPredicateValue(
    referencedQuestion: FormQuestion,
    operator: PrerequisiteOperator,
): PrerequisiteValue | undefined {
    if (operator === 'empty' || operator === 'not_empty') return undefined;
    if (operator === 'in' || operator === 'not_in') return [];
    switch (referencedQuestion.type) {
        case 'text':
            return '';
        case 'number':
            return 0;
        case 'boolean':
            return true;
        case 'select':
            return referencedQuestion.options?.[0] ?? '';
        case 'date':
            return new Date().toISOString().slice(0, 10);
    }
}

/** Returns the operators already claimed by siblingPredicates for targetQuestionId. */
export function getOperatorsAlreadyUsedOnQuestion(
    siblingPredicates: PrerequisitePredicate[],
    targetQuestionId: number,
): PrerequisiteOperator[] {
    return siblingPredicates
        .filter(predicate => predicate.questionId === targetQuestionId)
        .map(predicate => predicate.operator);
}

/**
 * Scans candidateQuestions in order and returns the first predicate that can be
 * added without duplicating an operator already present in existingSiblingPredicates.
 * Returns null if every operator on every candidate question is already claimed.
 */
export function findFirstAvailablePredicate(
    candidateQuestions: FormQuestion[],
    existingSiblingPredicates: PrerequisitePredicate[],
): PrerequisitePredicate | null {
    for (const candidateQuestion of candidateQuestions) {
        const operatorsAlreadyUsedOnCandidate =
            getOperatorsAlreadyUsedOnQuestion(
                existingSiblingPredicates,
                candidateQuestion.id,
            );
        const firstAvailableOperator = PREREQUISITE_OPERATORS_BY_QUESTION_TYPE[
            candidateQuestion.type
        ].find(operator => !operatorsAlreadyUsedOnCandidate.includes(operator));
        if (firstAvailableOperator) {
            return {
                questionId: candidateQuestion.id,
                operator: firstAvailableOperator,
                value: getDefaultPredicateValue(
                    candidateQuestion,
                    firstAvailableOperator,
                ),
            };
        }
    }
    return null;
}

// ── Natural-language preview ──────────────────────────────────────────────────

/** Finds a question by id anywhere in the question tree; returns undefined if not found. */
function findQuestionByIdInTree(
    targetQuestionId: number,
    questionTree: FormQuestion[] | undefined,
): FormQuestion | undefined {
    let foundQuestion: FormQuestion | undefined;
    walkQuestions(questionTree, question => {
        if (question.id === targetQuestionId) foundQuestion = question;
    });
    return foundQuestion;
}

/** Renders a PrerequisiteValue as a human-readable fragment for the preview sentence. */
function describePrerequisiteValue(
    predicateValue: PrerequisiteValue | undefined,
): string {
    if (predicateValue == null) return '(no value)';
    if (Array.isArray(predicateValue)) return `(${predicateValue.join(', ')})`;
    if (typeof predicateValue === 'boolean')
        return predicateValue ? 'Yes' : 'No';
    if (typeof predicateValue === 'number') return String(predicateValue);
    return `"${predicateValue}"`;
}

/** Recursively renders a prerequisite expression as a natural-language string. */
function describePrerequisiteExpression(
    prerequisiteExpression: PrerequisiteExpression,
    draft: Form,
): string {
    if ('questionId' in prerequisiteExpression) {
        const referencedQuestion = findQuestionByIdInTree(
            prerequisiteExpression.questionId,
            draft.questions,
        );
        const referencedQuestionLabel =
            referencedQuestion?.label ??
            `Question ${prerequisiteExpression.questionId}`;
        const operatorLabel =
            PREREQUISITE_OPERATOR_LABELS[prerequisiteExpression.operator];
        if (
            prerequisiteExpression.operator === 'empty' ||
            prerequisiteExpression.operator === 'not_empty'
        ) {
            return `"${referencedQuestionLabel}" ${operatorLabel}`;
        }
        return `"${referencedQuestionLabel}" ${operatorLabel} ${describePrerequisiteValue(prerequisiteExpression.value)}`;
    }
    const group = parseGroupExpression(prerequisiteExpression);
    if (!group) return '';
    const childDescriptions = group.childExpressions.map(childExpression => {
        const childDescription = describePrerequisiteExpression(
            childExpression,
            draft,
        );
        return 'questionId' in childExpression
            ? childDescription
            : `(${childDescription})`;
    });
    return childDescriptions.join(group.connector === 'all' ? ' AND ' : ' OR ');
}

/**
 * Returns a natural-language preview sentence for prerequisiteExpression within
 * the context of draft, or null when there is no prerequisite.
 */
export function describePrerequisite(
    prerequisiteExpression: PrerequisiteExpression | null,
    draft: Form,
): string | null {
    if (!prerequisiteExpression) return null;
    return describePrerequisiteExpression(prerequisiteExpression, draft);
}
```

---

### `src/features/form-builder/utils/question-diff-similarity.ts`

No renames from Part 1 apply here. Sections and signatures added only.

```ts
import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';

// ── Question pair similarity ──────────────────────────────────────────────────

/**
 * Scores how similar two questions from different form versions are, for use in
 * the greedy diff-matching algorithm. Higher is more similar; SIMILARITY_THRESHOLD
 * (5) is the minimum score for a match to be recorded.
 *
 * Weights: label text [0–5] > type match [2] > position match [1] >
 * option overlap [0–1] > required match [0.5].
 */
export function computeSimilarityScore(
    fromQuestion: FormQuestion,
    toQuestion: FormQuestion,
    fromSiblingPosition: number,
    toSiblingPosition: number,
): number {
    let score = 0;

    const labelSimilarity = computeDiceCoefficient(
        fromQuestion.label.trim().toLowerCase(),
        toQuestion.label.trim().toLowerCase(),
    );
    score += 5 * labelSimilarity;

    if (fromQuestion.type === toQuestion.type) score += 2;

    if (fromSiblingPosition === toSiblingPosition) score += 1;

    const fromQuestionOptions = fromQuestion.options ?? [];
    const toQuestionOptions = toQuestion.options ?? [];
    if (fromQuestionOptions.length > 0 || toQuestionOptions.length > 0) {
        score += computeJaccardSimilarity(
            fromQuestionOptions,
            toQuestionOptions,
        );
    }

    if (fromQuestion.required === toQuestion.required) score += 0.5;

    return score;
}

// ── Label similarity — Sørensen–Dice coefficient ──────────────────────────────

/**
 * Returns a Dice coefficient [0, 1] measuring label similarity via character
 * bigram overlap. Returns 1 for identical strings, 0 for strings shorter than 2
 * characters.
 */
function computeDiceCoefficient(
    firstLabel: string,
    secondLabel: string,
): number {
    if (firstLabel === secondLabel) return 1;
    if (firstLabel.length < 2 || secondLabel.length < 2) return 0;
    const firstBigrams = collectCharacterBigrams(firstLabel);
    const secondBigrams = collectCharacterBigrams(secondLabel);
    let bigramIntersectionCount = 0;
    for (const bigram of firstBigrams) {
        if (secondBigrams.has(bigram)) bigramIntersectionCount++;
    }
    return (
        (2 * bigramIntersectionCount) / (firstBigrams.size + secondBigrams.size)
    );
}

/** Returns the set of all two-character substrings (bigrams) in label. */
function collectCharacterBigrams(label: string): Set<string> {
    const bigrams = new Set<string>();
    for (
        let bigramStartIndex = 0;
        bigramStartIndex < label.length - 1;
        bigramStartIndex++
    ) {
        bigrams.add(label.slice(bigramStartIndex, bigramStartIndex + 2));
    }
    return bigrams;
}

// ── Option set similarity — Jaccard index ────────────────────────────────────

/** Returns the Jaccard index [0, 1] between two option lists treated as sets. Returns 0 for two empty lists. */
function computeJaccardSimilarity(
    firstOptions: string[],
    secondOptions: string[],
): number {
    const firstSet = new Set(firstOptions);
    const secondSet = new Set(secondOptions);
    let intersectionCount = 0;
    for (const item of firstSet) {
        if (secondSet.has(item)) intersectionCount++;
    }
    const unionSize = firstSet.size + secondSet.size - intersectionCount;
    if (unionSize === 0) return 0;
    return intersectionCount / unionSize;
}
```

---

### `src/features/form-builder/utils/form-version-diff.ts`

Changes applied: `matchedFromByToQuestion` → `fromQuestionByToQuestion`;
`areQuestionReferencesLabelEquivalent` → `questionLabelsMatch`.

```ts
import type {
    FormQuestion,
    FormQuestionType,
} from '@/api/form-question/contracts/form-question-schema';
import type {
    PrerequisiteExpression,
    PrerequisiteValue,
} from '@/api/form-question/contracts/prerequisite-expression-schema';
import type { Form } from '@/api/form/contracts/form-schema';
import { walkQuestions } from './walk-questions';
import { computeSimilarityScore } from './question-diff-similarity';

// ── Types ─────────────────────────────────────────────────────────────────────

export type QuestionDiff = {
    kind: 'unchanged' | 'added' | 'removed' | 'modified';
    fromQuestion: FormQuestion | null;
    toQuestion: FormQuestion | null;
    fieldChanges: {
        label?: { from: string; to: string };
        type?: { from: FormQuestionType; to: FormQuestionType };
        required?: { from: boolean; to: boolean };
        options?: { added: string[]; removed: string[] };
        prerequisite?: {
            from: PrerequisiteExpression | null;
            to: PrerequisiteExpression | null;
        };
        parent?: {
            from: { id: number; label: string } | null;
            to: { id: number; label: string } | null;
        };
    };
    children: QuestionDiff[];
};

// ── Entry point ───────────────────────────────────────────────────────────────

const SIMILARITY_THRESHOLD = 5;

/**
 * Computes a structural diff between two form versions using greedy similarity
 * matching. Returns the root-level diff list and a summary of added / removed /
 * modified / unchanged counts.
 */
export function computeFormVersionDiff(fromForm: Form, toForm: Form) {
    const fromQuestionsById = new Map<number, FormQuestion>();
    walkQuestions(fromForm.questions, question =>
        fromQuestionsById.set(question.id, question),
    );

    const toQuestionsById = new Map<number, FormQuestion>();
    walkQuestions(toForm.questions, question =>
        toQuestionsById.set(question.id, question),
    );

    const diffSummary = { added: 0, removed: 0, modified: 0, unchanged: 0 };

    /** Builds a QuestionDiff tree marking addedQuestion and all its descendants as added. */
    function buildAddedSubtree(addedQuestion: FormQuestion): QuestionDiff {
        diffSummary.added++;
        return {
            kind: 'added',
            fromQuestion: null,
            toQuestion: addedQuestion,
            fieldChanges: {},
            children: sortByOrder(addedQuestion.subQuestions).map(
                buildAddedSubtree,
            ),
        };
    }

    /** Builds a QuestionDiff tree marking removedQuestion and all its descendants as removed. */
    function buildRemovedSubtree(removedQuestion: FormQuestion): QuestionDiff {
        diffSummary.removed++;
        return {
            kind: 'removed',
            fromQuestion: removedQuestion,
            toQuestion: null,
            fieldChanges: {},
            children: sortByOrder(removedQuestion.subQuestions).map(
                buildRemovedSubtree,
            ),
        };
    }

    /**
     * Greedily matches fromSiblings to toSiblings by highest similarity score,
     * then classifies each pair as unchanged or modified, and any unmatched
     * questions as added or removed.
     */
    function buildSiblingDiffs(
        fromSiblings: FormQuestion[] | undefined,
        toSiblings: FormQuestion[] | undefined,
    ): QuestionDiff[] {
        const sortedFromSiblings = sortByOrder(fromSiblings);
        const sortedToSiblings = sortByOrder(toSiblings);

        const fromQuestionByToQuestion = new Map<FormQuestion, FormQuestion>();
        const unmatchedToSiblings = [...sortedToSiblings];
        const unmatchedFromSiblings = [...sortedFromSiblings];

        while (
            unmatchedToSiblings.length > 0 &&
            unmatchedFromSiblings.length > 0
        ) {
            let bestScore = SIMILARITY_THRESHOLD;
            let bestToIndex = -1;
            let bestFromIndex = -1;
            for (const [
                toIndex,
                candidateToQuestion,
            ] of unmatchedToSiblings.entries()) {
                const candidateToPosition =
                    sortedToSiblings.indexOf(candidateToQuestion);
                for (const [
                    fromIndex,
                    candidateFromQuestion,
                ] of unmatchedFromSiblings.entries()) {
                    const candidateFromPosition = sortedFromSiblings.indexOf(
                        candidateFromQuestion,
                    );
                    const pairScore = computeSimilarityScore(
                        candidateFromQuestion,
                        candidateToQuestion,
                        candidateFromPosition,
                        candidateToPosition,
                    );
                    if (pairScore >= bestScore) {
                        bestScore = pairScore;
                        bestToIndex = toIndex;
                        bestFromIndex = fromIndex;
                    }
                }
            }
            if (bestToIndex < 0) break;
            const matchedToQuestion = unmatchedToSiblings[bestToIndex]!;
            const matchedFromQuestion = unmatchedFromSiblings[bestFromIndex]!;
            fromQuestionByToQuestion.set(
                matchedToQuestion,
                matchedFromQuestion,
            );
            unmatchedToSiblings.splice(bestToIndex, 1);
            unmatchedFromSiblings.splice(bestFromIndex, 1);
        }

        const siblingDiffs: QuestionDiff[] = [];
        for (const toQuestion of sortedToSiblings) {
            const matchedFromQuestion =
                fromQuestionByToQuestion.get(toQuestion);
            if (matchedFromQuestion) {
                const fieldChanges = computeFieldChanges(
                    matchedFromQuestion,
                    toQuestion,
                    fromQuestionsById,
                    toQuestionsById,
                );
                const childDiffs = buildSiblingDiffs(
                    matchedFromQuestion.subQuestions,
                    toQuestion.subQuestions,
                );
                if (Object.keys(fieldChanges).length === 0) {
                    diffSummary.unchanged++;
                    siblingDiffs.push({
                        kind: 'unchanged',
                        fromQuestion: matchedFromQuestion,
                        toQuestion: toQuestion,
                        fieldChanges: {},
                        children: childDiffs,
                    });
                } else {
                    diffSummary.modified++;
                    siblingDiffs.push({
                        kind: 'modified',
                        fromQuestion: matchedFromQuestion,
                        toQuestion: toQuestion,
                        fieldChanges,
                        children: childDiffs,
                    });
                }
            } else {
                siblingDiffs.push(buildAddedSubtree(toQuestion));
            }
        }

        const matchedFromSiblings = new Set(fromQuestionByToQuestion.values());
        for (const fromQuestion of sortedFromSiblings) {
            if (matchedFromSiblings.has(fromQuestion)) continue;
            siblingDiffs.push(buildRemovedSubtree(fromQuestion));
        }

        return siblingDiffs;
    }

    const questionDiffs = buildSiblingDiffs(
        fromForm.questions,
        toForm.questions,
    );
    return { questionDiffs, summary: diffSummary };
}

// ── Sorting utility ───────────────────────────────────────────────────────────

/** Returns a sorted copy of questions by ascending order field; returns [] for undefined. */
function sortByOrder(questions: FormQuestion[] | undefined): FormQuestion[] {
    return (questions ?? []).slice().sort((a, b) => a.order - b.order);
}

// ── Field-level diffing ───────────────────────────────────────────────────────

/** Computes which fields differ between fromQuestion and toQuestion; returns an empty object for unchanged questions. */
function computeFieldChanges(
    fromQuestion: FormQuestion,
    toQuestion: FormQuestion,
    fromQuestionsById: Map<number, FormQuestion>,
    toQuestionsById: Map<number, FormQuestion>,
): QuestionDiff['fieldChanges'] {
    const fieldChanges: QuestionDiff['fieldChanges'] = {};

    if (fromQuestion.label !== toQuestion.label) {
        fieldChanges.label = {
            from: fromQuestion.label,
            to: toQuestion.label,
        };
    }
    if (fromQuestion.type !== toQuestion.type) {
        fieldChanges.type = {
            from: fromQuestion.type,
            to: toQuestion.type,
        };
    }
    if (fromQuestion.required !== toQuestion.required) {
        fieldChanges.required = {
            from: fromQuestion.required,
            to: toQuestion.required,
        };
    }

    const fromQuestionOptions = fromQuestion.options ?? [];
    const toQuestionOptions = toQuestion.options ?? [];
    const addedOptions = toQuestionOptions.filter(
        toOption => !fromQuestionOptions.includes(toOption),
    );
    const removedOptions = fromQuestionOptions.filter(
        fromOption => !toQuestionOptions.includes(fromOption),
    );
    if (addedOptions.length > 0 || removedOptions.length > 0) {
        fieldChanges.options = {
            added: addedOptions,
            removed: removedOptions,
        };
    }

    if (
        !arePrerequisiteExpressionsEquivalent(
            fromQuestion.prerequisite,
            toQuestion.prerequisite,
            fromQuestionsById,
            toQuestionsById,
        )
    ) {
        fieldChanges.prerequisite = {
            from: fromQuestion.prerequisite,
            to: toQuestion.prerequisite,
        };
    }

    if (
        !questionLabelsMatch(
            fromQuestion.parentId,
            toQuestion.parentId,
            fromQuestionsById,
            toQuestionsById,
        )
    ) {
        fieldChanges.parent = {
            from: resolveParentSummary(
                fromQuestion.parentId,
                fromQuestionsById,
            ),
            to: resolveParentSummary(toQuestion.parentId, toQuestionsById),
        };
    }

    return fieldChanges;
}

/** Resolves parentQuestionId to { id, label } for display in the diff UI; returns null for root questions. */
function resolveParentSummary(
    parentQuestionId: number | null,
    questionsById: Map<number, FormQuestion>,
): { id: number; label: string } | null {
    if (parentQuestionId === null) return null;
    const parentQuestion = questionsById.get(parentQuestionId)!;
    return { id: parentQuestionId, label: parentQuestion.label };
}

/**
 * Returns true if fromId and toId resolve (in their respective maps) to
 * questions with the same label. Handles null IDs (root-level questions) on
 * either side.
 */
function questionLabelsMatch(
    fromId: number | null,
    toId: number | null,
    fromQuestionsById: Map<number, FormQuestion>,
    toQuestionsById: Map<number, FormQuestion>,
): boolean {
    if (fromId === null && toId === null) return true;
    if (fromId === null || toId === null) return false;
    const fromQuestion = fromQuestionsById.get(fromId)!;
    const toQuestion = toQuestionsById.get(toId)!;
    return fromQuestion.label === toQuestion.label;
}

/** Returns true if two prerequisite expressions are structurally equivalent under label-based question matching. */
function arePrerequisiteExpressionsEquivalent(
    fromExpression: PrerequisiteExpression | null,
    toExpression: PrerequisiteExpression | null,
    fromQuestionsById: Map<number, FormQuestion>,
    toQuestionsById: Map<number, FormQuestion>,
): boolean {
    if (fromExpression === null && toExpression === null) return true;
    if (fromExpression === null || toExpression === null) return false;
    if ('questionId' in fromExpression && 'questionId' in toExpression) {
        if (
            !questionLabelsMatch(
                fromExpression.questionId,
                toExpression.questionId,
                fromQuestionsById,
                toQuestionsById,
            )
        ) {
            return false;
        }
        if (fromExpression.operator !== toExpression.operator) {
            return false;
        }
        return arePrerequisiteValuesEqual(
            fromExpression.value,
            toExpression.value,
        );
    }
    if ('all' in fromExpression && 'all' in toExpression) {
        if (fromExpression.all.length !== toExpression.all.length) {
            return false;
        }
        return fromExpression.all.every((branch, branchIndex) =>
            arePrerequisiteExpressionsEquivalent(
                branch,
                toExpression.all[branchIndex]!,
                fromQuestionsById,
                toQuestionsById,
            ),
        );
    }
    if ('any' in fromExpression && 'any' in toExpression) {
        if (fromExpression.any.length !== toExpression.any.length) {
            return false;
        }
        return fromExpression.any.every((branch, branchIndex) =>
            arePrerequisiteExpressionsEquivalent(
                branch,
                toExpression.any[branchIndex]!,
                fromQuestionsById,
                toQuestionsById,
            ),
        );
    }
    return false;
}

/** Returns true if two predicate values are equal; handles array values by element. */
function arePrerequisiteValuesEqual(
    firstValue: PrerequisiteValue | undefined,
    secondValue: PrerequisiteValue | undefined,
): boolean {
    if (firstValue === secondValue) return true;
    if (Array.isArray(firstValue) && Array.isArray(secondValue)) {
        return (
            firstValue.length === secondValue.length &&
            firstValue.every(
                (valueEntry, valueIndex) =>
                    valueEntry === secondValue[valueIndex],
            )
        );
    }
    return false;
}
```

---

## Part 3 — What is not included here

The following items from the cleanup plan are already complete and are not
repeated here:

- Phases 1–8 (all structural cleanup, dead-code removal, duplicate elimination)
- Phase 9 (absolute imports) — still pending but not related to naming

The following were explicitly rejected in the cleanup plan and are not proposed
again:

- Shortening `findDependentQuestions` /
  `prerequisiteExpressionReferencesQuestion` (Phase 3 — names carry load-bearing
  specificity)
- Shortening `isCreateQuestionInDraftFormPending` /
  `isUpdateQuestionInDraftFormPending` (Phase 3 — long names connect each flag
  to its source hook)
- Renaming `matchedFromByToQuestion` to the short form `matchedFrom` (Phase 8 —
  loses the Map's indexing direction); this document's proposed
  `fromQuestionByToQuestion` is a different proposal that preserves the
  direction while fixing the word order.
