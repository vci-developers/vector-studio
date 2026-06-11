import type { Result } from '@/lib/result/result';
import type {
    PostLocationTypeToProgramRequestBody,
    PostLocationTypeToProgramSuccessPayload,
} from '../contracts/post-location-type-to-program-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { locationTypeKeys } from '../location-type-keys';

type PostLocationTypeToProgramVariables = {
    programId: number;
    requestBody: PostLocationTypeToProgramRequestBody;
};

type PostLocationTypeToProgramMutationResult = Result<
    PostLocationTypeToProgramSuccessPayload,
    NetworkError
>;

async function createLocationTypeInProgram({
    programId,
    requestBody,
}: PostLocationTypeToProgramVariables): Promise<PostLocationTypeToProgramMutationResult> {
    const response = await fetch(`/api/programs/${programId}/location-types`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    const postLocationTypeToProgramResult: PostLocationTypeToProgramMutationResult =
        await response.json();
    return postLocationTypeToProgramResult;
}

export function usePostLocationTypeToProgram() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createLocationTypeInProgram,
        onSuccess: (data, variables) => {
            if (data.ok) {
                queryClient.invalidateQueries({
                    queryKey: locationTypeKeys.locationTypesByProgramId(
                        variables.programId,
                    ),
                });
            }
        },
    });
}
