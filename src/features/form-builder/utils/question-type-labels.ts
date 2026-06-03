import type { FormQuestionType } from '@/api/form-question/contracts/form-question-schema';

/** Human-readable labels for question types, used in the type selector. */
export const QUESTION_TYPE_LABELS: Record<FormQuestionType, string> = {
    text: 'Short text',
    number: 'Number',
    boolean: 'Yes / No',
    select: 'Dropdown',
    date: 'Date',
};
