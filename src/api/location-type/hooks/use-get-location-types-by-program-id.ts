import type { NetworkError } from '@/lib/network/network-error';
import type { GetLocationTypesByProgramIdSuccessPayload } from '../contracts/get-location-types-by-program-id-schema';
import type { Result } from '@/lib/result/result';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { locationTypeKeys } from '../location-type-keys';

type GetLocationTypesByProgramIdQueryResult = Result<
    GetLocationTypesByProgramIdSuccessPayload,
    NetworkError
>;

type GetLocationTypesByProgramIdQueryOptions = Omit<
    UseQueryOptions<GetLocationTypesByProgramIdQueryResult, NetworkError>,
    'queryKey' | 'queryFn'
>;

async function fetchLocationTypesByProgramId(
    programId: number,
): Promise<GetLocationTypesByProgramIdQueryResult> {
    const response = await fetch(`/api/programs/${programId}/location-types`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    });

    const getLocationTypesByProgramIdResult: GetLocationTypesByProgramIdQueryResult =
        await response.json();
    return getLocationTypesByProgramIdResult;
}

export function useGetLocationTypesByProgramId(
    programId: number,
    options?: GetLocationTypesByProgramIdQueryOptions,
) {
    return useQuery({
        queryKey: locationTypeKeys.locationTypesByProgramId(programId),
        queryFn: () => fetchLocationTypesByProgramId(programId),
        ...options,
    });
}
