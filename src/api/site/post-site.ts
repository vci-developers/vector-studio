import { err, type Result } from '@/lib/result/result';
import {
    postSiteRequestSchema,
    postSiteResponseSchema,
    type PostSiteRequestBody,
    type PostSiteResponseBody,
} from './contracts/post-site-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { safeApiCall } from '@/lib/network/safe-api-call';

export async function postSite(
    accessToken: string,
    requestBody: PostSiteRequestBody,
): Promise<Result<PostSiteResponseBody, NetworkError>> {
    const parsedRequestBody = postSiteRequestSchema.safeParse(requestBody);
    if (!parsedRequestBody.success) {
        return err({ kind: 'client' });
    }

    return safeApiCall<PostSiteResponseBody>(
        '/sites/register',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(parsedRequestBody.data),
        },
        postSiteResponseSchema,
    );
}
