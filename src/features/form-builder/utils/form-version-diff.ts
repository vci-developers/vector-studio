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

const SIMILARITY_THRESHOLD = 5;

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

    function buildSiblingDiffs(
        fromSiblings: FormQuestion[] | undefined,
        toSiblings: FormQuestion[] | undefined,
    ): QuestionDiff[] {
        const sortedFromSiblings = sortByOrder(fromSiblings);
        const sortedToSiblings = sortByOrder(toSiblings);

        const matchedFromByToQuestion = new Map<FormQuestion, FormQuestion>();
        const unmatchedToSiblings = [...sortedToSiblings];
        const unmatchedFromSiblings = [...sortedFromSiblings];

        while (
            unmatchedToSiblings.length > 0 &&
            unmatchedFromSiblings.length > 0
        ) {
            let highestPairScore = SIMILARITY_THRESHOLD;
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
                    if (pairScore >= highestPairScore) {
                        highestPairScore = pairScore;
                        bestToIndex = toIndex;
                        bestFromIndex = fromIndex;
                    }
                }
            }
            if (bestToIndex < 0) break;
            const matchedToQuestion = unmatchedToSiblings[bestToIndex]!;
            const matchedFromQuestion = unmatchedFromSiblings[bestFromIndex]!;
            matchedFromByToQuestion.set(matchedToQuestion, matchedFromQuestion);
            unmatchedToSiblings.splice(bestToIndex, 1);
            unmatchedFromSiblings.splice(bestFromIndex, 1);
        }

        const siblingDiffs: QuestionDiff[] = [];
        for (const toQuestion of sortedToSiblings) {
            const matchedFromQuestion = matchedFromByToQuestion.get(toQuestion);
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

        const matchedFromSiblings = new Set(matchedFromByToQuestion.values());
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

function sortByOrder(questions: FormQuestion[] | undefined): FormQuestion[] {
    return (questions ?? []).slice().sort((a, b) => a.order - b.order);
}

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
        !areQuestionReferencesLabelEquivalent(
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

function resolveParentSummary(
    parentQuestionId: number | null,
    questionsById: Map<number, FormQuestion>,
): { id: number; label: string } | null {
    if (parentQuestionId === null) return null;
    const parentQuestion = questionsById.get(parentQuestionId)!;
    return { id: parentQuestionId, label: parentQuestion.label };
}

function areQuestionReferencesLabelEquivalent(
    fromReferencedQuestionId: number | null,
    toReferencedQuestionId: number | null,
    fromQuestionsById: Map<number, FormQuestion>,
    toQuestionsById: Map<number, FormQuestion>,
): boolean {
    if (fromReferencedQuestionId === null && toReferencedQuestionId === null) {
        return true;
    }
    if (fromReferencedQuestionId === null || toReferencedQuestionId === null) {
        return false;
    }
    const fromReferencedQuestion = fromQuestionsById.get(
        fromReferencedQuestionId,
    )!;
    const toReferencedQuestion = toQuestionsById.get(toReferencedQuestionId)!;
    return fromReferencedQuestion.label === toReferencedQuestion.label;
}

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
            !areQuestionReferencesLabelEquivalent(
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
    if ('not' in fromExpression && 'not' in toExpression) {
        return arePrerequisiteExpressionsEquivalent(
            fromExpression.not,
            toExpression.not,
            fromQuestionsById,
            toQuestionsById,
        );
    }
    return false;
}

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
