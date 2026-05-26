import type { Result } from '@/lib/result/result';
import type {
    PutQuestionToDraftFormRequestBody,
    PutQuestionToDraftFormSuccessPayload,
} from '../contracts/put-question-to-draft-form-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formKeys } from '@/api/form/form-keys';

type PutQuestionToDraftFormVariables = {
    programId: number;
    questionId: number;
    requestBody: PutQuestionToDraftFormRequestBody;
};

type PutQuestionToDraftFormMutationResult = Result<
    PutQuestionToDraftFormSuccessPayload,
    NetworkError
>;

async function updateQuestionInDraftForm({
    programId,
    questionId,
    requestBody,
}: PutQuestionToDraftFormVariables): Promise<PutQuestionToDraftFormMutationResult> {
    const response = await fetch(
        `/api/programs/${programId}/forms/questions/${questionId}`,
        {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        },
    );

    const putQuestionToDraftFormResult: PutQuestionToDraftFormMutationResult =
        await response.json();
    return putQuestionToDraftFormResult;
}

export function usePutQuestionToDraftForm() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateQuestionInDraftForm,
        onSuccess: (data, variables) => {
            if (data.ok) {
                queryClient.invalidateQueries({
                    queryKey: formKeys.draftByProgramId(variables.programId),
                });
            }
        },
    });
}
