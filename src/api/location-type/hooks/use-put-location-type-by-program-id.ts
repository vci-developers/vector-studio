import type { Result } from '@/lib/result/result';
import type {
    PutLocationTypeByProgramIdRequestBody,
    PutLocationTypeByProgramIdSuccessPayload,
} from '../contracts/put-location-type-by-program-id-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { locationTypeKeys } from '../location-type-keys';

type PutLocationTypeByProgramIdVariables = {
    programId: number;
    locationTypeId: number;
    requestBody: PutLocationTypeByProgramIdRequestBody;
};

type PutLocationTypeByProgramIdMutationResult = Result<
    PutLocationTypeByProgramIdSuccessPayload,
    NetworkError
>;

async function updateLocationTypeInProgram({
    programId,
    locationTypeId,
    requestBody,
}: PutLocationTypeByProgramIdVariables): Promise<PutLocationTypeByProgramIdMutationResult> {
    const response = await fetch(
        `/api/programs/${programId}/location-types/${locationTypeId}`,
        {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        },
    );

    const putLocationTypeByProgramIdResult: PutLocationTypeByProgramIdMutationResult =
        await response.json();
    return putLocationTypeByProgramIdResult;
}

export function usePutLocationTypeByProgramId() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateLocationTypeInProgram,
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
