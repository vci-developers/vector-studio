import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type { Form } from '@/api/form/contracts/form-schema';

export function getNextQuestionOrder(draft: Form): number {
    let highestExistingOrder = 0;

    const visitQuestion = (question: FormQuestion) => {
        if (question.order > highestExistingOrder) {
            highestExistingOrder = question.order;
        }
        question.subQuestions?.forEach(visitQuestion);
    };

    draft.questions?.forEach(visitQuestion);
    return highestExistingOrder + 1;
}

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
    const swapPartnerIndex =
        direction === 'up' ? questionToMoveIndex - 1 : questionToMoveIndex + 1;

    const questionToMove = siblingsSortedByOrder[questionToMoveIndex];
    const swapPartner = siblingsSortedByOrder[swapPartnerIndex];
    if (!questionToMove || !swapPartner) return null;

    return [
        { id: questionToMove.id, order: swapPartner.order },
        { id: swapPartner.id, order: questionToMove.order },
    ];
}
