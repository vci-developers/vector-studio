import { err, type Result } from '@/lib/result/result';
import {
    putDraftFormByProgramIdRequestSchema,
    putDraftFormByProgramIdResponseSchema,
    type PutDraftFormByProgramIdRequestBody,
    type PutDraftFormByProgramIdResponseBody,
} from './contracts/put-draft-form-by-program-id-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { safeApiCall } from '@/lib/network/safe-api-call';

export async function putDraftFormByProgramId(
    accessToken: string,
    programId: number,
    requestBody: PutDraftFormByProgramIdRequestBody,
): Promise<Result<PutDraftFormByProgramIdResponseBody, NetworkError>> {
    const parsedRequestBody =
        putDraftFormByProgramIdRequestSchema.safeParse(requestBody);
    if (!parsedRequestBody.success) {
        return err({ kind: 'client' });
    }

    return safeApiCall<PutDraftFormByProgramIdResponseBody>(
        `/programs/${programId}/forms`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(parsedRequestBody.data),
        },
        putDraftFormByProgramIdResponseSchema,
    );
}
