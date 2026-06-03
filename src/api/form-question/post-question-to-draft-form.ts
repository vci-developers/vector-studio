import { err, type Result } from '@/lib/result/result';
import {
    postQuestionToDraftFormRequestSchema,
    postQuestionToDraftFormResponseSchema,
    type PostQuestionToDraftFormRequestBody,
    type PostQuestionToDraftFormResponseBody,
} from './contracts/post-question-to-draft-form-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { safeApiCall } from '@/lib/network/safe-api-call';

export async function postQuestionToDraftForm(
    accessToken: string,
    programId: number,
    requestBody: PostQuestionToDraftFormRequestBody,
): Promise<Result<PostQuestionToDraftFormResponseBody, NetworkError>> {
    const parsedRequestBody =
        postQuestionToDraftFormRequestSchema.safeParse(requestBody);
    if (!parsedRequestBody.success) {
        return err({ kind: 'client' });
    }

    return safeApiCall<PostQuestionToDraftFormResponseBody>(
        `/programs/${programId}/forms/questions`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(parsedRequestBody.data),
        },
        postQuestionToDraftFormResponseSchema,
    );
}
