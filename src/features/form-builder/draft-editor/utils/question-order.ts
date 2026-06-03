import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type { Form } from '@/api/form/contracts/form-schema';
import { walkQuestions } from '../../utils/walk-questions';

// ── Next order ────────────────────────────────────────────────────────────────

/** Returns max(order) + 1 across all questions in draft. */
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

/** Returns the list of same-level siblings that contains targetQuestionId, searching recursively; null if not found. */
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

// ── Adjacent swap ─────────────────────────────────────────────────────────────

/** Returns the two { id, order } updates needed to swap questionToMoveId with its adjacent sibling. */
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
