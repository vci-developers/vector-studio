import type { NetworkError } from '@/lib/network/network-error';
import type { GetProgramFormByVersionSuccessPayload } from '../contracts/get-program-form-by-version-schema';
import type { Result } from '@/lib/result/result';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { formKeys } from '../form-keys';

type GetDraftFormByProgramIdQueryResult = Result<
    GetProgramFormByVersionSuccessPayload,
    NetworkError
>;

type GetDraftFormByProgramIdQueryOptions = Omit<
    UseQueryOptions<GetDraftFormByProgramIdQueryResult, NetworkError>,
    'queryKey' | 'queryFn'
>;

async function fetchDraftFormByProgramId(
    programId: number,
): Promise<GetDraftFormByProgramIdQueryResult> {
    const response = await fetch(`/api/programs/${programId}/forms/draft`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    });

    const getDraftFormByProgramIdResult: GetDraftFormByProgramIdQueryResult =
        await response.json();
    return getDraftFormByProgramIdResult;
}

export function useGetDraftFormByProgramId(
    programId: number,
    options?: GetDraftFormByProgramIdQueryOptions,
) {
    return useQuery({
        queryKey: formKeys.draftByProgramId(programId),
        queryFn: () => fetchDraftFormByProgramId(programId),
        ...options,
    });
}
