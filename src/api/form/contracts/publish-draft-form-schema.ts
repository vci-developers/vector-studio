import { z } from 'zod';
import { formSchema } from './form-schema';

export const publishDraftFormRequestSchema = z.object({
    version: z.string().min(1),
});

export const publishDraftFormResponseSchema = z.object({
    message: z.string(),
    form: formSchema,
});

export type PublishDraftFormRequestBody = z.infer<
    typeof publishDraftFormRequestSchema
>;

export type PublishDraftFormResponseBody = z.infer<
    typeof publishDraftFormResponseSchema
>;
export type PublishDraftFormSuccessPayload = PublishDraftFormResponseBody;
