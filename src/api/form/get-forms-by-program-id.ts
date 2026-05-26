import type { Result } from '@/lib/result/result';
import {
    getFormsByProgramIdResponseSchema,
    type GetFormsByProgramIdResponseBody,
} from './contracts/get-forms-by-program-id-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { safeApiCall } from '@/lib/network/safe-api-call';

export async function getFormsByProgramId(
    accessToken: string,
    programId: number,
): Promise<Result<GetFormsByProgramIdResponseBody, NetworkError>> {
    return safeApiCall<GetFormsByProgramIdResponseBody>(
        `/programs/${programId}/forms`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        getFormsByProgramIdResponseSchema,
    );
}
