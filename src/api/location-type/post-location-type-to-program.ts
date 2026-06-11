import { err, type Result } from '@/lib/result/result';
import {
    postLocationTypeToProgramRequestSchema,
    postLocationTypeToProgramResponseSchema,
    type PostLocationTypeToProgramRequestBody,
    type PostLocationTypeToProgramResponseBody,
} from './contracts/post-location-type-to-program-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { safeApiCall } from '@/lib/network/safe-api-call';

export async function postLocationTypeToProgram(
    accessToken: string,
    programId: number,
    requestBody: PostLocationTypeToProgramRequestBody,
): Promise<Result<PostLocationTypeToProgramResponseBody, NetworkError>> {
    const parsedRequestBody =
        postLocationTypeToProgramRequestSchema.safeParse(requestBody);
    if (!parsedRequestBody.success) {
        return err({ kind: 'client' });
    }

    return safeApiCall<PostLocationTypeToProgramResponseBody>(
        `/programs/${programId}/location-types`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(parsedRequestBody.data),
        },
        postLocationTypeToProgramResponseSchema,
    );
}
