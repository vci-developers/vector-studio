import { z } from 'zod';
import {
    formQuestionSchema,
    formQuestionTypeSchema,
} from './form-question-schema';
import { prerequisiteExpressionSchema } from './prerequisite-expression-schema';

export const putQuestionToDraftFormRequestSchema = z
    .object({
        label: z.string().min(1),
        type: formQuestionTypeSchema,
        required: z.boolean(),
        parentId: z.number().nullable(),
        options: z.array(z.string()).nullable(),
        order: z.number(),
        prerequisite: prerequisiteExpressionSchema.nullable(),
    })
    .partial();

export const putQuestionToDraftFormResponseSchema = z.object({
    message: z.string(),
    question: formQuestionSchema,
});

export type PutQuestionToDraftFormRequestBody = z.infer<
    typeof putQuestionToDraftFormRequestSchema
>;

export type PutQuestionToDraftFormResponseBody = z.infer<
    typeof putQuestionToDraftFormResponseSchema
>;
export type PutQuestionToDraftFormSuccessPayload =
    PutQuestionToDraftFormResponseBody;
