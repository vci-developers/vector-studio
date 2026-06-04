'use client';

import type { LocationType } from '@/api/location-type/contracts/location-type-schema';
import { useGetLocationTypesByProgramId } from '@/api/location-type/hooks/use-get-location-types-by-program-id';
import type { Site } from '@/api/site/contracts/site-schema';
import { useMemo, useState } from 'react';
import LocationBuilderSkeleton from '../loading/location-builder-skeleton';
import ErrorBanner from '@/components/error/error-banner';
import LocationLevelList from './location-level-list';
import DeleteLocationLevelDialog from './delete-location-level-dialog';

interface LocationBuilderProps {
    programId: number;
    accessibleSites: Site[];
}

export default function LocationBuilder({
    programId,
    accessibleSites,
}: LocationBuilderProps) {
    const {
        data: getLocationTypesByProgramIdResult,
        isPending: isGetLocationTypesByProgramIdPending,
        refetch: refetchLocationTypesByProgramId,
    } = useGetLocationTypesByProgramId(programId);

    const [locationTypePendingDeletion, setLocationTypePendingDeletion] =
        useState<LocationType | null>(null);

    const locationTypesSortedByLevel = useMemo(() => {
        if (!getLocationTypesByProgramIdResult?.ok) return [];
        return [...getLocationTypesByProgramIdResult.data.locationTypes].sort(
            (a, b) => a.level - b.level,
        );
    }, [getLocationTypesByProgramIdResult]);

    const firstLevelWithNoSitesIndex = useMemo(() => {
        const occupiedLocationTypeIds = new Set(
            accessibleSites
                .map(site => site.locationTypeId)
                .filter(
                    (locationTypeId): locationTypeId is number =>
                        locationTypeId != null,
                ),
        );

        let levelIndex = 0;
        for (const locationType of locationTypesSortedByLevel) {
            if (!occupiedLocationTypeIds.has(locationType.id)) break;
            levelIndex += 1;
        }
        return levelIndex;
    }, [accessibleSites, locationTypesSortedByLevel]);

    if (
        !getLocationTypesByProgramIdResult ||
        isGetLocationTypesByProgramIdPending
    ) {
        return <LocationBuilderSkeleton />;
    }

    if (!getLocationTypesByProgramIdResult.ok) {
        return (
            <ErrorBanner
                title="Couldn't load location levels"
                error={getLocationTypesByProgramIdResult.error}
                onRetry={refetchLocationTypesByProgramId}
            />
        );
    }

    return (
        <div className="space-y-8">
            <LocationLevelList
                programId={programId}
                locationTypes={locationTypesSortedByLevel}
                firstLevelWithNoSitesIndex={firstLevelWithNoSitesIndex}
                onDeleteLocationType={setLocationTypePendingDeletion}
            />
            <DeleteLocationLevelDialog
                locationType={locationTypePendingDeletion}
                programId={programId}
                onClose={() => setLocationTypePendingDeletion(null)}
            />
        </div>
    );
}
