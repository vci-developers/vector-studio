import type { Result } from '@/lib/result/result';
import type { DeleteLocationTypeFromProgramSuccessPayload } from '../contracts/delete-location-type-from-program-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { locationTypeKeys } from '../location-type-keys';

type DeleteLocationTypeFromProgramVariables = {
    programId: number;
    locationTypeId: number;
};

type DeleteLocationTypeFromProgramMutationResult = Result<
    DeleteLocationTypeFromProgramSuccessPayload,
    NetworkError
>;

async function removeLocationTypeFromProgram({
    programId,
    locationTypeId,
}: DeleteLocationTypeFromProgramVariables): Promise<DeleteLocationTypeFromProgramMutationResult> {
    const response = await fetch(
        `/api/programs/${programId}/location-types/${locationTypeId}`,
        {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        },
    );

    const deleteLocationTypeFromProgramResult: DeleteLocationTypeFromProgramMutationResult =
        await response.json();
    return deleteLocationTypeFromProgramResult;
}

export function useDeleteLocationTypeFromProgram() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: removeLocationTypeFromProgram,
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
