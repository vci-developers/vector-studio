import type { FormQuestionType } from '@/api/form-question/contracts/form-question-schema';

export const QUESTION_TYPE_LABELS: Record<FormQuestionType, string> = {
    text: 'Short text',
    number: 'Number',
    boolean: 'Yes / No',
    select: 'Dropdown',
    date: 'Date',
};
