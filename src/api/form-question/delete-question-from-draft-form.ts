import type { Result } from '@/lib/result/result';
import {
    deleteQuestionFromDraftFormResponseSchema,
    type DeleteQuestionFromDraftFormResponseBody,
} from './contracts/delete-question-from-draft-form-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { safeApiCall } from '@/lib/network/safe-api-call';

export async function deleteQuestionFromDraftForm(
    accessToken: string,
    programId: number,
    questionId: number,
): Promise<Result<DeleteQuestionFromDraftFormResponseBody, NetworkError>> {
    return safeApiCall<DeleteQuestionFromDraftFormResponseBody>(
        `/programs/${programId}/forms/questions/${questionId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        deleteQuestionFromDraftFormResponseSchema,
    );
}
