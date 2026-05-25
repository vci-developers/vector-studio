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

export function diffFormVersions(fromForm: Form, toForm: Form) {
    const fromQuestionsById = new Map<number, FormQuestion>();
    walkQuestions(fromForm.questions, question =>
        fromQuestionsById.set(question.id, question),
    );

    const toQuestionsById = new Map<number, FormQuestion>();
    walkQuestions(toForm.questions, question =>
        toQuestionsById.set(question.id, question),
    );

    const diffSummary = { added: 0, removed: 0, modified: 0, unchanged: 0 };

    function buildAddedSubtree(addedToQuestion: FormQuestion): QuestionDiff {
        diffSummary.added++;
        const subQuestionsInOrder = (addedToQuestion.subQuestions ?? [])
            .slice()
            .sort((a, b) => a.order - b.order);
        return {
            kind: 'added',
            fromQuestion: null,
            toQuestion: addedToQuestion,
            fieldChanges: {},
            children: subQuestionsInOrder.map(buildAddedSubtree),
        };
    }

    function buildRemovedSubtree(
        removedFromQuestion: FormQuestion,
    ): QuestionDiff {
        diffSummary.removed++;
        const trulyRemovedChildrenInOrder = (
            removedFromQuestion.subQuestions ?? []
        )
            .slice()
            .sort((a, b) => a.order - b.order)
            .filter(
                fromChildQuestion => !toQuestionsById.has(fromChildQuestion.id),
            );
        return {
            kind: 'removed',
            fromQuestion: removedFromQuestion,
            toQuestion: null,
            fieldChanges: {},
            children: trulyRemovedChildrenInOrder.map(buildRemovedSubtree),
        };
    }

    function buildDiffsForLevel(
        toQuestionsAtThisLevel: FormQuestion[] | undefined,
        fromQuestionsAtThisLevel: FormQuestion[] | undefined,
    ): QuestionDiff[] {
        const toQuestionsInOrder = (toQuestionsAtThisLevel ?? [])
            .slice()
            .sort((a, b) => a.order - b.order);
        const fromQuestionsInOrder = (fromQuestionsAtThisLevel ?? [])
            .slice()
            .sort((a, b) => a.order - b.order);

        const matchedFromByToQuestion = new Map<FormQuestion, FormQuestion>();

        for (const toQuestion of toQuestionsInOrder) {
            const idMatchingFromQuestion = fromQuestionsById.get(toQuestion.id);
            if (idMatchingFromQuestion) {
                matchedFromByToQuestion.set(toQuestion, idMatchingFromQuestion);
            }
        }

        const consumedFromForSimilarity = new Set<FormQuestion>();
        const eligibleUnmatchedToQuestions = toQuestionsInOrder.filter(
            toQuestion => !matchedFromByToQuestion.has(toQuestion),
        );
        const eligibleUnmatchedFromQuestions = fromQuestionsInOrder.filter(
            fromQuestion => !toQuestionsById.has(fromQuestion.id),
        );

        while (
            eligibleUnmatchedToQuestions.length > 0 &&
            eligibleUnmatchedFromQuestions.length > 0
        ) {
            let highestPairScore = SIMILARITY_THRESHOLD;
            let bestToIndex = -1;
            let bestFromIndex = -1;
            for (
                let toIndex = 0;
                toIndex < eligibleUnmatchedToQuestions.length;
                toIndex++
            ) {
                const candidateToQuestion =
                    eligibleUnmatchedToQuestions[toIndex]!;
                const candidateToPosition =
                    toQuestionsInOrder.indexOf(candidateToQuestion);
                for (
                    let fromIndex = 0;
                    fromIndex < eligibleUnmatchedFromQuestions.length;
                    fromIndex++
                ) {
                    const candidateFromQuestion =
                        eligibleUnmatchedFromQuestions[fromIndex]!;
                    const candidateFromPosition = fromQuestionsInOrder.indexOf(
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
            const pairedToQuestion = eligibleUnmatchedToQuestions[bestToIndex]!;
            const pairedFromQuestion =
                eligibleUnmatchedFromQuestions[bestFromIndex]!;
            matchedFromByToQuestion.set(pairedToQuestion, pairedFromQuestion);
            consumedFromForSimilarity.add(pairedFromQuestion);
            eligibleUnmatchedToQuestions.splice(bestToIndex, 1);
            eligibleUnmatchedFromQuestions.splice(bestFromIndex, 1);
        }

        const diffsAtThisLevel: QuestionDiff[] = [];
        for (const toQuestion of toQuestionsInOrder) {
            const matchedFromQuestion = matchedFromByToQuestion.get(toQuestion);
            if (matchedFromQuestion) {
                const fieldChanges = computeFieldChangesBetween(
                    matchedFromQuestion,
                    toQuestion,
                    fromQuestionsById,
                    toQuestionsById,
                );
                const childDiffs = buildDiffsForLevel(
                    toQuestion.subQuestions,
                    matchedFromQuestion.subQuestions,
                );
                if (Object.keys(fieldChanges).length === 0) {
                    diffSummary.unchanged++;
                    diffsAtThisLevel.push({
                        kind: 'unchanged',
                        fromQuestion: matchedFromQuestion,
                        toQuestion: toQuestion,
                        fieldChanges: {},
                        children: childDiffs,
                    });
                } else {
                    diffSummary.modified++;
                    diffsAtThisLevel.push({
                        kind: 'modified',
                        fromQuestion: matchedFromQuestion,
                        toQuestion: toQuestion,
                        fieldChanges,
                        children: childDiffs,
                    });
                }
            } else {
                diffsAtThisLevel.push(buildAddedSubtree(toQuestion));
            }
        }

        for (const fromQuestion of fromQuestionsInOrder) {
            if (consumedFromForSimilarity.has(fromQuestion)) continue;
            if (toQuestionsById.has(fromQuestion.id)) continue;
            diffsAtThisLevel.push(buildRemovedSubtree(fromQuestion));
        }

        return diffsAtThisLevel;
    }

    const questionDiffs = buildDiffsForLevel(
        toForm.questions,
        fromForm.questions,
    );
    return { questionDiffs, summary: diffSummary };
}

function computeSimilarityScore(
    fromQuestion: FormQuestion,
    toQuestion: FormQuestion,
    fromPositionInLevel: number,
    toPositionInLevel: number,
): number {
    let score = 0;

    const labelSimilarity = computeDiceCoefficient(
        normalizeLabelForComparison(fromQuestion.label),
        normalizeLabelForComparison(toQuestion.label),
    );
    score += 5 * labelSimilarity;

    if (fromQuestion.type === toQuestion.type) score += 2;

    if (fromPositionInLevel === toPositionInLevel) score += 1;

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

function normalizeLabelForComparison(label: string): string {
    return label.trim().toLowerCase();
}

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

function computeFieldChangesBetween(
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
        !arePrerequisitesEquivalent(
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
    const parentQuestion = questionsById.get(parentQuestionId);
    return {
        id: parentQuestionId,
        label: parentQuestion?.label ?? `Question ${parentQuestionId}`,
    };
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
    );
    const toReferencedQuestion = toQuestionsById.get(toReferencedQuestionId);
    if (!fromReferencedQuestion || !toReferencedQuestion) return false;
    return fromReferencedQuestion.label === toReferencedQuestion.label;
}

function arePrerequisitesEquivalent(
    firstPrerequisite: PrerequisiteExpression | null,
    secondPrerequisite: PrerequisiteExpression | null,
    fromQuestionsById: Map<number, FormQuestion>,
    toQuestionsById: Map<number, FormQuestion>,
): boolean {
    if (firstPrerequisite === null && secondPrerequisite === null) return true;
    if (firstPrerequisite === null || secondPrerequisite === null) return false;
    return arePrerequisiteExpressionsEquivalent(
        firstPrerequisite,
        secondPrerequisite,
        fromQuestionsById,
        toQuestionsById,
    );
}

function arePrerequisiteExpressionsEquivalent(
    firstExpression: PrerequisiteExpression,
    secondExpression: PrerequisiteExpression,
    fromQuestionsById: Map<number, FormQuestion>,
    toQuestionsById: Map<number, FormQuestion>,
): boolean {
    if ('questionId' in firstExpression && 'questionId' in secondExpression) {
        if (
            !areQuestionReferencesLabelEquivalent(
                firstExpression.questionId,
                secondExpression.questionId,
                fromQuestionsById,
                toQuestionsById,
            )
        ) {
            return false;
        }
        if (firstExpression.operator !== secondExpression.operator) {
            return false;
        }
        return arePrerequisiteValuesEqual(
            firstExpression.value,
            secondExpression.value,
        );
    }
    if ('all' in firstExpression && 'all' in secondExpression) {
        if (firstExpression.all.length !== secondExpression.all.length) {
            return false;
        }
        return firstExpression.all.every((branch, branchIndex) =>
            arePrerequisiteExpressionsEquivalent(
                branch,
                secondExpression.all[branchIndex]!,
                fromQuestionsById,
                toQuestionsById,
            ),
        );
    }
    if ('any' in firstExpression && 'any' in secondExpression) {
        if (firstExpression.any.length !== secondExpression.any.length) {
            return false;
        }
        return firstExpression.any.every((branch, branchIndex) =>
            arePrerequisiteExpressionsEquivalent(
                branch,
                secondExpression.any[branchIndex]!,
                fromQuestionsById,
                toQuestionsById,
            ),
        );
    }
    if ('not' in firstExpression && 'not' in secondExpression) {
        return arePrerequisiteExpressionsEquivalent(
            firstExpression.not,
            secondExpression.not,
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
