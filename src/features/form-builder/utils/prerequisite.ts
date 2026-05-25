import type {
    FormQuestion,
    FormQuestionType,
} from '@/api/form-question/contracts/form-question-schema';
import type {
    PrerequisiteExpression,
    PrerequisiteOperator,
    PrerequisitePredicate,
    PrerequisiteValue,
} from '@/api/form-question/contracts/prerequisite-expression-schema';
import type { Form } from '@/api/form/contracts/form-schema';
import { walkQuestions } from './walk-questions';

export const OPERATOR_LABELS: Record<PrerequisiteOperator, string> = {
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

export const OPERATORS_BY_QUESTION_TYPE: Record<
    FormQuestionType,
    PrerequisiteOperator[]
> = {
    text: ['eq', 'neq', 'contains', 'not_contains', 'empty', 'not_empty'],
    number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'empty', 'not_empty'],
    boolean: ['eq', 'neq', 'empty', 'not_empty'],
    select: ['eq', 'neq', 'in', 'not_in', 'empty', 'not_empty'],
    date: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'empty', 'not_empty'],
};

export function isPrerequisiteEditable(
    expression: PrerequisiteExpression | null,
): boolean {
    if (!expression) return true;
    if ('questionId' in expression) return true;
    if ('not' in expression) return false;
    if ('all' in expression) {
        return expression.all.every(branch => 'questionId' in branch);
    }
    if ('any' in expression) {
        return expression.any.every(branch => 'questionId' in branch);
    }
    return false;
}

export function getPrerequisiteConnector(
    expression: PrerequisiteExpression | null,
): 'all' | 'any' {
    if (expression && 'any' in expression) return 'any';
    return 'all';
}

export function getPrerequisitePredicates(
    expression: PrerequisiteExpression | null,
): PrerequisitePredicate[] {
    if (!expression) return [];
    if ('questionId' in expression) return [expression];
    if ('all' in expression) {
        return expression.all.filter(
            (branch): branch is PrerequisitePredicate => 'questionId' in branch,
        );
    }
    if ('any' in expression) {
        return expression.any.filter(
            (branch): branch is PrerequisitePredicate => 'questionId' in branch,
        );
    }
    return [];
}

export function buildPrerequisite(
    connector: 'all' | 'any',
    predicates: PrerequisitePredicate[],
): PrerequisiteExpression | null {
    const [firstPredicate, ...remainingPredicates] = predicates;
    if (!firstPredicate) return null;
    if (remainingPredicates.length === 0) return firstPredicate;
    return connector === 'all' ? { all: predicates } : { any: predicates };
}

export function getDefaultValueForPredicate(
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

export function getOperatorsUsedOnQuestion(
    predicates: PrerequisitePredicate[],
    targetQuestionId: number,
    excludingPredicateIndex: number | null,
): PrerequisiteOperator[] {
    return predicates
        .filter(
            (predicate, predicateIndex) =>
                predicateIndex !== excludingPredicateIndex &&
                predicate.questionId === targetQuestionId,
        )
        .map(predicate => predicate.operator);
}

function findQuestionById(
    targetQuestionId: number,
    questions: FormQuestion[] | undefined,
): FormQuestion | undefined {
    let foundQuestion: FormQuestion | undefined;
    walkQuestions(questions, question => {
        if (question.id === targetQuestionId) foundQuestion = question;
    });
    return foundQuestion;
}

function describePrerequisiteValue(
    value: PrerequisiteValue | undefined,
): string {
    if (value == null) return '(no value)';
    if (Array.isArray(value)) return `(${value.join(', ')})`;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return String(value);
    return `"${value}"`;
}

function describeExpression(
    expression: PrerequisiteExpression,
    draft: Form,
): string {
    if ('questionId' in expression) {
        const referencedQuestion = findQuestionById(
            expression.questionId,
            draft.questions,
        );
        const referencedQuestionLabel =
            referencedQuestion?.label ?? `Question ${expression.questionId}`;
        const operatorLabel = OPERATOR_LABELS[expression.operator];
        if (
            expression.operator === 'empty' ||
            expression.operator === 'not_empty'
        ) {
            return `"${referencedQuestionLabel}" ${operatorLabel}`;
        }
        return `"${referencedQuestionLabel}" ${operatorLabel} ${describePrerequisiteValue(expression.value)}`;
    }
    if ('all' in expression) {
        return expression.all
            .map(branch => describeExpression(branch, draft))
            .join(' AND ');
    }
    if ('any' in expression) {
        return expression.any
            .map(branch => describeExpression(branch, draft))
            .join(' OR ');
    }
    if ('not' in expression) {
        return `NOT (${describeExpression(expression.not, draft)})`;
    }
    return '';
}

export function describePrerequisite(
    expression: PrerequisiteExpression | null,
    draft: Form,
): string | null {
    if (!expression) return null;
    return describeExpression(expression, draft);
}
