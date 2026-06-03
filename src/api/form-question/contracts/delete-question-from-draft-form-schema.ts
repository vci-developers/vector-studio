import z from 'zod';

export const deleteQuestionFromDraftFormResponseSchema = z.object({
    message: z.string(),
});

export type DeleteQuestionFromDraftFormResponseBody = z.infer<
    typeof deleteQuestionFromDraftFormResponseSchema
>;
export type DeleteQuestionFromDraftFormSuccessPayload =
    DeleteQuestionFromDraftFormResponseBody;
