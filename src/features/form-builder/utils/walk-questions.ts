import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';

export function walkQuestions(
    questions: FormQuestion[] | undefined,
    visit: (question: FormQuestion) => void,
): void {
    if (!questions) return;
    for (const question of questions) {
        visit(question);
        walkQuestions(question.subQuestions, visit);
    }
}
