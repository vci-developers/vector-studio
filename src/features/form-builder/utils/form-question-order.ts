import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type { Form } from '@/api/form/contracts/form-schema';

export function nextOrderFor(draft: Form): number {
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

function findSiblingsContainingQuestion(
    targetQuestionId: number,
    candidateSiblings: FormQuestion[] | undefined,
): FormQuestion[] | null {
    if (!candidateSiblings) return null;
    if (candidateSiblings.some(question => question.id === targetQuestionId)) {
        return candidateSiblings;
    }
    for (const question of candidateSiblings) {
        const foundSiblings = findSiblingsContainingQuestion(
            targetQuestionId,
            question.subQuestions,
        );
        if (foundSiblings) return foundSiblings;
    }
    return null;
}

export function swapAdjacentSiblings(
    questionToMoveId: number,
    direction: 'up' | 'down',
    draft: Form,
): Array<{ id: number; order: number }> | null {
    const siblings = findSiblingsContainingQuestion(
        questionToMoveId,
        draft.questions,
    );
    if (!siblings) return null;

    const siblingsSortedByOrder = [...siblings].sort(
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
