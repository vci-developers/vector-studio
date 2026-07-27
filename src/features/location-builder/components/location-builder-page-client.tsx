'use client';

import ProgramGate from '@/components/gate/program-gate';
import LocationBuilderSkeleton from './loading/location-builder-skeleton';
import LegacyProgramEmptyState from './empty-state/legacy-program-empty-state';
import LocationBuilder from './location-builder/location-builder';

export default function LocationBuilderPageClient() {
    return (
        <ProgramGate
            skeleton={<LocationBuilderSkeleton />}
            legacyFallback={<LegacyProgramEmptyState />}
        >
            {(programId, permissions) => (
                <LocationBuilder
                    programId={programId}
                    accessibleSites={permissions.sites.canAccessSites}
                    canWriteSiteMetadata={permissions.sites.writeSiteMetadata}
                />
            )}
        </ProgramGate>
    );
}
