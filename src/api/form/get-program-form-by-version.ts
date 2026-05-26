import type { Result } from '@/lib/result/result';
import {
    getProgramFormByVersionResponseSchema,
    type GetProgramFormByVersionResponseBody,
} from './contracts/get-program-form-by-version-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { safeApiCall } from '@/lib/network/safe-api-call';

export async function getProgramFormByVersion(
    accessToken: string,
    programId: number,
    version: string,
): Promise<Result<GetProgramFormByVersionResponseBody, NetworkError>> {
    return safeApiCall<GetProgramFormByVersionResponseBody>(
        `/programs/${programId}/forms/${version}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        getProgramFormByVersionResponseSchema,
    );
}
