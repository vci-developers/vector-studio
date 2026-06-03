import { err, type Result } from '@/lib/result/result';
import {
    putLocationTypeByProgramIdRequestSchema,
    putLocationTypeByProgramIdResponseSchema,
    type PutLocationTypeByProgramIdRequestBody,
    type PutLocationTypeByProgramIdResponseBody,
} from './contracts/put-location-type-by-program-id-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { safeApiCall } from '@/lib/network/safe-api-call';

export async function putLocationTypeByProgramId(
    accessToken: string,
    programId: number,
    locationTypeId: number,
    requestBody: PutLocationTypeByProgramIdRequestBody,
): Promise<Result<PutLocationTypeByProgramIdResponseBody, NetworkError>> {
    const parsedRequestBody =
        putLocationTypeByProgramIdRequestSchema.safeParse(requestBody);
    if (!parsedRequestBody.success) {
        return err({ kind: 'client' });
    }

    return safeApiCall<PutLocationTypeByProgramIdResponseBody>(
        `/programs/${programId}/location-types/${locationTypeId}`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(parsedRequestBody.data),
        },
        putLocationTypeByProgramIdResponseSchema,
    );
}
