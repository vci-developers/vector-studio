import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type { PrerequisiteExpression } from '@/api/form-question/contracts/prerequisite-expression-schema';
import type { Form } from '@/api/form/contracts/form-schema';

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
    if ('not' in expression) {
        return prerequisiteExpressionReferencesQuestion(
            expression.not,
            targetQuestionId,
        );
    }
    return false;
}

export function findDependentQuestions(targetQuestionId: number, draft: Form) {
    const dependentQuestions: FormQuestion[] = [];

    const visitQuestion = (question: FormQuestion) => {
        if (
            prerequisiteExpressionReferencesQuestion(
                question.prerequisite,
                targetQuestionId,
            )
        ) {
            dependentQuestions.push(question);
        }
        question.subQuestions?.forEach(visitQuestion);
    };

    draft.questions?.forEach(visitQuestion);
    return dependentQuestions;
}
