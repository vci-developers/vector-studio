import { z } from 'zod';
import { formSchema } from './form-schema';

export const publishDraftFormForProgramRequestSchema = z.object({
    version: z.string().min(1),
});

export const publishDraftFormForProgramResponseSchema = z.object({
    message: z.string(),
    form: formSchema,
});

export type PublishDraftFormForProgramRequestBody = z.infer<
    typeof publishDraftFormForProgramRequestSchema
>;

export type PublishDraftFormForProgramResponseBody = z.infer<
    typeof publishDraftFormForProgramResponseSchema
>;
export type PublishDraftFormForProgramSuccessPayload =
    PublishDraftFormForProgramResponseBody;
