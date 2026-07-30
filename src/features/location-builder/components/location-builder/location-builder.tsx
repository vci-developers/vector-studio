'use client';

import type { LocationType } from '@/api/location-type/contracts/location-type-schema';
import { useGetLocationTypesByProgramId } from '@/api/location-type/hooks/use-get-location-types-by-program-id';
import type { Site } from '@/api/site/contracts/site-schema';
import { useState } from 'react';
import ErrorBanner from '@/components/error/error-banner';
import LocationBuilderSkeleton from '@/features/location-builder/components/loading/location-builder-skeleton';
import DeleteLocationTypeDialog from '@/features/location-builder/components/location-type-builder/delete-location-type-dialog';
import LocationTypesList from '@/features/location-builder/components/location-type-builder/location-types-list';
import SiteColumnView from '@/features/location-builder/components/site-builder/site-column-view';

interface LocationBuilderProps {
    programId: number;
    accessibleSites: Site[];
    canWriteSiteMetadata: boolean;
}

export default function LocationBuilder({
    programId,
    accessibleSites,
    canWriteSiteMetadata,
}: LocationBuilderProps) {
    const {
        data: getLocationTypesByProgramIdResult,
        isPending: isGetLocationTypesByProgramIdPending,
        refetch: refetchLocationTypesByProgramId,
    } = useGetLocationTypesByProgramId(programId);

    const [locationTypePendingDeletion, setLocationTypePendingDeletion] =
        useState<LocationType | null>(null);

    const locationTypesSortedByLevel = getLocationTypesByProgramIdResult?.ok
        ? [...getLocationTypesByProgramIdResult.data.locationTypes].sort(
              (a, b) => a.level - b.level,
          )
        : [];

    const occupiedLocationTypeIds = new Set(
        accessibleSites.map(site => site.locationTypeId),
    );
    const firstUnoccupiedLevelIndex = locationTypesSortedByLevel.findIndex(
        locationType => !occupiedLocationTypeIds.has(locationType.id),
    );
    const firstLevelWithNoSitesIndex =
        firstUnoccupiedLevelIndex === -1
            ? locationTypesSortedByLevel.length
            : firstUnoccupiedLevelIndex;

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
            <LocationTypesList
                programId={programId}
                locationTypes={locationTypesSortedByLevel}
                firstLevelWithNoSitesIndex={firstLevelWithNoSitesIndex}
                onDeleteLocationType={setLocationTypePendingDeletion}
            />
            <SiteColumnView
                programId={programId}
                accessibleSites={accessibleSites}
                orderedLocationTypes={locationTypesSortedByLevel}
                canWriteSiteMetadata={canWriteSiteMetadata}
            />
            <DeleteLocationTypeDialog
                locationType={locationTypePendingDeletion}
                programId={programId}
                onClose={() => setLocationTypePendingDeletion(null)}
            />
        </div>
    );
}
