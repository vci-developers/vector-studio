import z from 'zod';
import {
    formQuestionSchema,
    formQuestionTypeSchema,
} from './form-question-schema';
import { prerequisiteExpressionSchema } from './prerequisite-expression-schema';

export const postQuestionToDraftFormRequestSchema = z.object({
    label: z.string().min(1),
    type: formQuestionTypeSchema,
    required: z.boolean(),
    parentId: z.number().nullable(),
    options: z.array(z.string()).nullable(),
    order: z.number(),
    prerequisite: prerequisiteExpressionSchema.nullable(),
});

export const postQuestionToDraftFormResponseSchema = z.object({
    message: z.string(),
    question: formQuestionSchema,
});

export type PostQuestionToDraftFormRequestBody = z.infer<
    typeof postQuestionToDraftFormRequestSchema
>;

export type PostQuestionToDraftFormResponseBody = z.infer<
    typeof postQuestionToDraftFormResponseSchema
>;
export type PostQuestionToDraftFormSuccessPayload =
    PostQuestionToDraftFormResponseBody;
