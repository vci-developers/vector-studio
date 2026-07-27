import type { Result } from '@/lib/result/result';
import type {
    PutSiteRequestBody,
    PutSiteSuccessPayload,
} from '../contracts/put-site-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/api/user/user-keys';

type PutSiteVariables = {
    siteId: number;
    requestBody: PutSiteRequestBody;
};

type PutSiteMutationResult = Result<PutSiteSuccessPayload, NetworkError>;

async function updateSite({
    siteId,
    requestBody,
}: PutSiteVariables): Promise<PutSiteMutationResult> {
    const response = await fetch(`/api/sites/${siteId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    const putSiteResult: PutSiteMutationResult = await response.json();
    return putSiteResult;
}

export function usePutSite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateSite,
        onSuccess: data => {
            if (data.ok) {
                queryClient.invalidateQueries({
                    queryKey: userKeys.permissions(),
                });
            }
        },
    });
}
