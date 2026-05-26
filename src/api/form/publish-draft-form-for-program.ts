import { err, type Result } from '@/lib/result/result';
import {
    publishDraftFormForProgramRequestSchema,
    publishDraftFormForProgramResponseSchema,
    type PublishDraftFormForProgramRequestBody,
    type PublishDraftFormForProgramResponseBody,
} from './contracts/publish-draft-form-for-program-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { safeApiCall } from '@/lib/network/safe-api-call';

export async function publishDraftFormForProgram(
    accessToken: string,
    programId: number,
    requestBody: PublishDraftFormForProgramRequestBody,
): Promise<Result<PublishDraftFormForProgramResponseBody, NetworkError>> {
    const parsedRequestBody =
        publishDraftFormForProgramRequestSchema.safeParse(requestBody);
    if (!parsedRequestBody.success) {
        return err({ kind: 'client' });
    }

    return safeApiCall<PublishDraftFormForProgramResponseBody>(
        `/programs/${programId}/forms/publish`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(parsedRequestBody.data),
        },
        publishDraftFormForProgramResponseSchema,
    );
}
