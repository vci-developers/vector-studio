import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type { PrerequisiteExpression } from '@/api/form-question/contracts/prerequisite-expression-schema';
import type { Form } from '@/api/form/contracts/form-schema';
import { walkQuestions } from '../../utils/walk-questions';

// ── Prerequisite reference check ──────────────────────────────────────────────

/** Returns true if any predicate in expression (recursively) references targetQuestionId. */
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

/** Returns every question in draft whose prerequisite references targetQuestionId. */
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
