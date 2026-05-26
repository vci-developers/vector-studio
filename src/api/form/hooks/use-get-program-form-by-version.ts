import type { Result } from '@/lib/result/result';
import type { GetProgramFormByVersionSuccessPayload } from '../contracts/get-program-form-by-version-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { formKeys } from '../form-keys';

type GetProgramFormByVersionQueryResult = Result<
    GetProgramFormByVersionSuccessPayload,
    NetworkError
>;

type GetProgramFormByVersionQueryOptions = Omit<
    UseQueryOptions<GetProgramFormByVersionQueryResult, NetworkError>,
    'queryKey' | 'queryFn'
>;

async function fetchProgramFormByVersion(
    programId: number,
    version: string,
): Promise<GetProgramFormByVersionQueryResult> {
    const response = await fetch(
        `/api/programs/${programId}/forms/${version}`,
        {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        },
    );

    const getProgramFormByVersionResult: GetProgramFormByVersionQueryResult =
        await response.json();
    return getProgramFormByVersionResult;
}

export function useGetProgramFormByVersion(
    programId: number,
    version: string,
    options?: GetProgramFormByVersionQueryOptions,
) {
    return useQuery({
        queryKey: formKeys.programFormByVersion(programId, version),
        queryFn: () => fetchProgramFormByVersion(programId, version),
        ...options,
    });
}
