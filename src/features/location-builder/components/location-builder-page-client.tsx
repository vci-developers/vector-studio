'use client';

import ProgramGate from '@/components/gate/program-gate';
import LocationBuilderSkeleton from './loading/location-builder-skeleton';
import UgandaProgramEmptyState from './empty-state/uganda-program-empty-state';
import LocationBuilder from './builder/location-builder';

export default function LocationBuilderPageClient() {
    return (
        <ProgramGate
            skeleton={<LocationBuilderSkeleton />}
            ugandaFallback={<UgandaProgramEmptyState />}
        >
            {(programId, permissions) => (
                <LocationBuilder
                    programId={programId}
                    accessibleSites={permissions.sites.canAccessSites}
                />
            )}
        </ProgramGate>
    );
}
