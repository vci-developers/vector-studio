import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';

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
