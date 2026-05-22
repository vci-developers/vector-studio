import type { Result } from '@/lib/result/result';
import type { DeleteQuestionFromDraftFormSuccessPayload } from '../contracts/delete-question-from-draft-form-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formKeys } from '@/api/form/form-keys';

type DeleteQuestionFromDraftFormVariables = {
    programId: number;
    questionId: number;
};

type DeleteQuestionFromDraftFormMutationResult = Result<
    DeleteQuestionFromDraftFormSuccessPayload,
    NetworkError
>;

async function removeQuestionFromDraftForm({
    programId,
    questionId,
}: DeleteQuestionFromDraftFormVariables): Promise<DeleteQuestionFromDraftFormMutationResult> {
    const response = await fetch(
        `/api/programs/${programId}/forms/questions/${questionId}`,
        {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        },
    );

    const deleteQuestionFromDraftFormResult: DeleteQuestionFromDraftFormMutationResult =
        await response.json();
    return deleteQuestionFromDraftFormResult;
}

export function useDeleteQuestionFromDraftForm() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: removeQuestionFromDraftForm,
        onSuccess: (data, variables) => {
            if (data.ok) {
                queryClient.invalidateQueries({
                    queryKey: formKeys.draftByProgramId(variables.programId),
                });
            }
        },
    });
}
