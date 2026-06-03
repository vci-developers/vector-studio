import type { Result } from '@/lib/result/result';
import {
    getLocationTypesByProgramIdResponseSchema,
    type GetLocationTypesByProgramIdResponseBody,
} from './contracts/get-location-types-by-program-id-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { safeApiCall } from '@/lib/network/safe-api-call';

export async function getLocationTypesByProgramId(
    accessToken: string,
    programId: number,
): Promise<Result<GetLocationTypesByProgramIdResponseBody, NetworkError>> {
    return safeApiCall<GetLocationTypesByProgramIdResponseBody>(
        `/programs/${programId}/location-types`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        getLocationTypesByProgramIdResponseSchema,
    );
}
