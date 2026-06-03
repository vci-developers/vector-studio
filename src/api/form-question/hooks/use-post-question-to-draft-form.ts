import type { Result } from '@/lib/result/result';
import type {
    PostQuestionToDraftFormRequestBody,
    PostQuestionToDraftFormSuccessPayload,
} from '../contracts/post-question-to-draft-form-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formKeys } from '@/api/form/form-keys';

type PostQuestionToDraftFormVariables = {
    programId: number;
    requestBody: PostQuestionToDraftFormRequestBody;
};

type PostQuestionToDraftFormMutationResult = Result<
    PostQuestionToDraftFormSuccessPayload,
    NetworkError
>;

async function createQuestionInDraftForm({
    programId,
    requestBody,
}: PostQuestionToDraftFormVariables): Promise<PostQuestionToDraftFormMutationResult> {
    const response = await fetch(`/api/programs/${programId}/forms/questions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    const postQuestionToDraftFormResult: PostQuestionToDraftFormMutationResult =
        await response.json();
    return postQuestionToDraftFormResult;
}

export function usePostQuestionToDraftForm() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createQuestionInDraftForm,
        onSuccess: (data, variables) => {
            if (data.ok) {
                queryClient.invalidateQueries({
                    queryKey: formKeys.draftByProgramId(variables.programId),
                });
            }
        },
    });
}
