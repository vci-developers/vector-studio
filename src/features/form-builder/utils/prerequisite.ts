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

/** Natural-language labels for operator tokens, shown in the predicate-row dropdown. */
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

/** Natural-language labels for group connectors, shown in the connector dropdown. */
export const PREREQUISITE_GROUP_CONNECTOR_LABELS: Record<
    PrerequisiteGroupConnector,
    string
> = {
    all: 'ALL of these match',
    any: 'ANY of these match',
};

/** Allowed operators per question type, used to filter the operator dropdown. */
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

// ── Group expression ──────────────────────────────────────────────────────────

/** Unwraps an all/any group node into { connector, childExpressions }; null for predicate nodes. */
export function getPrerequisiteGroupParts(
    prerequisiteExpression: PrerequisiteExpression,
): {
    connector: PrerequisiteGroupConnector;
    childExpressions: PrerequisiteExpression[];
} | null {
    if ('all' in prerequisiteExpression) {
        return {
            connector: 'all',
            childExpressions: prerequisiteExpression.all,
        };
    }
    if ('any' in prerequisiteExpression) {
        return {
            connector: 'any',
            childExpressions: prerequisiteExpression.any,
        };
    }
    return null;
}

/** Builds an all/any group node from connector and children; null for an empty children list. */
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

/** Prunes null children and unwraps single-child groups; null for a null or fully-pruned input. */
export function simplifyPrerequisiteExpression(
    prerequisiteExpression: PrerequisiteExpression | null,
): PrerequisiteExpression | null {
    if (!prerequisiteExpression) return null;
    if ('questionId' in prerequisiteExpression) return prerequisiteExpression;
    const groupParts = getPrerequisiteGroupParts(prerequisiteExpression);
    if (!groupParts) return null;
    const simplifiedChildExpressions = groupParts.childExpressions
        .map(childExpression => simplifyPrerequisiteExpression(childExpression))
        .filter(
            (childExpression): childExpression is PrerequisiteExpression =>
                childExpression !== null,
        );
    if (simplifiedChildExpressions.length === 0) return null;
    if (simplifiedChildExpressions.length === 1)
        return simplifiedChildExpressions[0]!;
    return buildPrerequisiteGroup(
        groupParts.connector,
        simplifiedChildExpressions,
    );
}

// ── Predicate defaults & availability ────────────────────────────────────────

/** Returns the initial value for a new predicate given the question type and operator. */
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

/** Returns operators already claimed by siblingPredicates for targetQuestionId. */
export function getOperatorsAlreadyUsedOnQuestion(
    siblingPredicates: PrerequisitePredicate[],
    targetQuestionId: number,
): PrerequisiteOperator[] {
    return siblingPredicates
        .filter(predicate => predicate.questionId === targetQuestionId)
        .map(predicate => predicate.operator);
}

/** Finds the first predicate that can be added without duplicating a sibling's operator; null if none available. */
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

/** Finds a question by id anywhere in the tree; undefined if not found. */
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

/** Formats a predicate value for display in the preview sentence. */
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

/** Recursively renders a prerequisite expression as natural language. */
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
    const groupParts = getPrerequisiteGroupParts(prerequisiteExpression);
    if (!groupParts) return '';
    const childDescriptions = groupParts.childExpressions.map(
        childExpression => {
            const childDescription = describePrerequisiteExpression(
                childExpression,
                draft,
            );
            return 'questionId' in childExpression
                ? childDescription
                : `(${childDescription})`;
        },
    );
    return childDescriptions.join(
        groupParts.connector === 'all' ? ' AND ' : ' OR ',
    );
}

/** Returns a natural-language description of prerequisiteExpression, or null if there is none. */
export function describePrerequisite(
    prerequisiteExpression: PrerequisiteExpression | null,
    draft: Form,
): string | null {
    if (!prerequisiteExpression) return null;
    return describePrerequisiteExpression(prerequisiteExpression, draft);
}
