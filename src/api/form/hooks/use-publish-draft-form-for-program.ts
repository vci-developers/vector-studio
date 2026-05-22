import type { Result } from '@/lib/result/result';
import type {
    PublishDraftFormForProgramRequestBody,
    PublishDraftFormForProgramSuccessPayload,
} from '../contracts/publish-draft-form-for-program-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formKeys } from '../form-keys';

type PublishDraftFormForProgramVariables = {
    programId: number;
    requestBody: PublishDraftFormForProgramRequestBody;
};

type PublishDraftFormForProgramMutationResult = Result<
    PublishDraftFormForProgramSuccessPayload,
    NetworkError
>;

async function publishDraftFormForProgram({
    programId,
    requestBody,
}: PublishDraftFormForProgramVariables): Promise<PublishDraftFormForProgramMutationResult> {
    const response = await fetch(`/api/programs/${programId}/forms/publish`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    const publishDraftFormForProgramResult: PublishDraftFormForProgramMutationResult =
        await response.json();
    return publishDraftFormForProgramResult;
}

export function usePublishDraftFormForProgram() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: publishDraftFormForProgram,
        onSuccess: (data, variables) => {
            if (data.ok) {
                queryClient.invalidateQueries({
                    queryKey: formKeys.formsByProgramId(variables.programId),
                });
            }
        },
    });
}
