import { err, type Result } from '@/lib/result/result';
import {
    putSiteRequestSchema,
    putSiteResponseSchema,
    type PutSiteRequestBody,
    type PutSiteResponseBody,
} from './contracts/put-site-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { safeApiCall } from '@/lib/network/safe-api-call';

export async function putSite(
    accessToken: string,
    siteId: number,
    requestBody: PutSiteRequestBody,
): Promise<Result<PutSiteResponseBody, NetworkError>> {
    const parsedRequestBody = putSiteRequestSchema.safeParse(requestBody);
    if (!parsedRequestBody.success) {
        return err({ kind: 'client' });
    }

    return safeApiCall<PutSiteResponseBody>(
        `/sites/${siteId}`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(parsedRequestBody.data),
        },
        putSiteResponseSchema,
    );
}
