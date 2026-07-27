import type { Result } from '@/lib/result/result';
import type {
    PostSiteRequestBody,
    PostSiteSuccessPayload,
} from '../contracts/post-site-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/api/user/user-keys';

type PostSiteMutationResult = Result<PostSiteSuccessPayload, NetworkError>;

async function createSite(
    requestBody: PostSiteRequestBody,
): Promise<PostSiteMutationResult> {
    const response = await fetch('/api/sites/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    const postSiteResult: PostSiteMutationResult = await response.json();
    return postSiteResult;
}

export function usePostSite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSite,
        onSuccess: data => {
            if (data.ok) {
                queryClient.invalidateQueries({
                    queryKey: userKeys.permissions(),
                });
            }
        },
    });
}
