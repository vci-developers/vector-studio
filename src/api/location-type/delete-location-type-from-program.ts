import type { Result } from '@/lib/result/result';
import {
    deleteLocationTypeFromProgramResponseSchema,
    type DeleteLocationTypeFromProgramResponseBody,
} from './contracts/delete-location-type-from-program-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { safeApiCall } from '@/lib/network/safe-api-call';

export async function deleteLocationTypeFromProgram(
    accessToken: string,
    programId: number,
    locationTypeId: number,
): Promise<Result<DeleteLocationTypeFromProgramResponseBody, NetworkError>> {
    return safeApiCall<DeleteLocationTypeFromProgramResponseBody>(
        `/programs/${programId}/location-types/${locationTypeId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        deleteLocationTypeFromProgramResponseSchema,
    );
}
