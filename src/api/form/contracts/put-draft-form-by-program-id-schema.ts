import { z } from 'zod';
import { formSchema } from './form-schema';

export const putDraftFormByProgramIdRequestSchema = z.object({
    name: z.string().min(1),
});

export const putDraftFormByProgramIdResponseSchema = z.object({
    message: z.string(),
    form: formSchema,
});

export type PutDraftFormByProgramIdRequestBody = z.infer<
    typeof putDraftFormByProgramIdRequestSchema
>;

export type PutDraftFormByProgramIdResponseBody = z.infer<
    typeof putDraftFormByProgramIdResponseSchema
>;
export type PutDraftFormByProgramIdSuccessPayload =
    PutDraftFormByProgramIdResponseBody;
