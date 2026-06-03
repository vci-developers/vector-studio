import { err, type Result } from '@/lib/result/result';
import {
    putQuestionToDraftFormRequestSchema,
    type PutQuestionToDraftFormResponseBody,
    putQuestionToDraftFormResponseSchema,
    type PutQuestionToDraftFormRequestBody,
} from './contracts/put-question-to-draft-form-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { safeApiCall } from '@/lib/network/safe-api-call';

export async function putQuestionToDraftForm(
    accessToken: string,
    programId: number,
    questionId: number,
    requestBody: PutQuestionToDraftFormRequestBody,
): Promise<Result<PutQuestionToDraftFormResponseBody, NetworkError>> {
    const parsedRequestBody =
        putQuestionToDraftFormRequestSchema.safeParse(requestBody);
    if (!parsedRequestBody.success) {
        return err({ kind: 'client' });
    }

    return safeApiCall<PutQuestionToDraftFormResponseBody>(
        `/programs/${programId}/forms/questions/${questionId}`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(parsedRequestBody.data),
        },
        putQuestionToDraftFormResponseSchema,
    );
}
