import type { NetworkError } from '@/lib/network/network-error';
import type { GetFormsByProgramIdSuccessPayload } from '../contracts/get-forms-by-program-id-schema';
import type { Result } from '@/lib/result/result';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { formKeys } from '../form-keys';

type GetFormsByProgramIdQueryResult = Result<
    GetFormsByProgramIdSuccessPayload,
    NetworkError
>;

type GetFormsByProgramIdQueryOptions = Omit<
    UseQueryOptions<GetFormsByProgramIdQueryResult, NetworkError>,
    'queryKey' | 'queryFn'
>;

async function fetchFormsByProgramId(
    programId: number,
): Promise<GetFormsByProgramIdQueryResult> {
    const response = await fetch(`/api/programs/${programId}/forms`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    });

    const getFormsByProgramIdResult: GetFormsByProgramIdQueryResult =
        await response.json();
    return getFormsByProgramIdResult;
}

export function useGetFormsByProgramId(
    programId: number,
    options?: GetFormsByProgramIdQueryOptions,
) {
    return useQuery({
        queryKey: formKeys.formsByProgramId(programId),
        queryFn: () => fetchFormsByProgramId(programId),
        ...options,
    });
}
