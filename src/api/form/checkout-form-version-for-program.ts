import type { NetworkError } from '@/lib/network/network-error';
import {
    checkoutFormVersionForProgramResponseSchema,
    type CheckoutFormVersionForProgramResponseBody,
} from './contracts/checkout-form-version-for-program-schema';
import type { Result } from '@/lib/result/result';
import { safeApiCall } from '@/lib/network/safe-api-call';

export async function checkoutFormVersionForProgram(
    accessToken: string,
    programId: number,
    version: string,
): Promise<Result<CheckoutFormVersionForProgramResponseBody, NetworkError>> {
    return safeApiCall<CheckoutFormVersionForProgramResponseBody>(
        `/programs/${programId}/forms/${version}/checkout`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        checkoutFormVersionForProgramResponseSchema,
    );
}
