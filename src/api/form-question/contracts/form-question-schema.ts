import { z } from 'zod';
import { prerequisiteExpressionSchema } from './prerequisite-expression-schema';

export const formQuestionTypeSchema = z.enum([
    'text',
    'number',
    'boolean',
    'select',
    'date',
]);

export const formQuestionSchema = z.object({
    id: z.number(),
    formId: z.number(),
    parentId: z.number().nullable(),
    label: z.string(),
    type: formQuestionTypeSchema,
    required: z.boolean(),
    options: z.array(z.string()).nullable(),
    order: z.number(),
    prerequisite: prerequisiteExpressionSchema.nullable(),
    createdAt: z.number(),
    updatedAt: z.number(),
    get subQuestions() {
        return z.array(formQuestionSchema).optional();
    },
});

export type FormQuestionType = z.infer<typeof formQuestionTypeSchema>;
export type FormQuestion = z.infer<typeof formQuestionSchema>;
