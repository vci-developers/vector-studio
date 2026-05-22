import type { Result } from '@/lib/result/result';
import type {
    PutDraftFormByProgramIdRequestBody,
    PutDraftFormByProgramIdSuccessPayload,
} from '../contracts/put-draft-form-by-program-id-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formKeys } from '../form-keys';

type PutDraftFormByProgramIdVariables = {
    programId: number;
    requestBody: PutDraftFormByProgramIdRequestBody;
};

type PutDraftFormByProgramIdMutationResult = Result<
    PutDraftFormByProgramIdSuccessPayload,
    NetworkError
>;

async function updateDraftFormByProgramId({
    programId,
    requestBody,
}: PutDraftFormByProgramIdVariables): Promise<PutDraftFormByProgramIdMutationResult> {
    const response = await fetch(`/api/programs/${programId}/forms`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    const putDraftFormByProgramIdResult: PutDraftFormByProgramIdMutationResult =
        await response.json();
    return putDraftFormByProgramIdResult;
}

export function usePutDraftFormByProgramId() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateDraftFormByProgramId,
        onSuccess: (data, variables) => {
            if (data.ok) {
                queryClient.invalidateQueries({
                    queryKey: formKeys.draftByProgramId(variables.programId),
                });
            }
        },
    });
}
