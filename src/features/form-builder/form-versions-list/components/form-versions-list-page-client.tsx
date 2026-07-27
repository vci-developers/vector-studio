'use client';

import FormVersionsListSkeleton from '@/features/form-builder/form-versions-list/components/loading/form-versions-list-skeleton';
import FormVersionsList from './versions-list/form-versions-list';
import ProgramGate from '@/components/gate/program-gate';
import LegacyProgramEmptyState from '../../components/empty-state/legacy-program-empty-state';

export default function FormVersionsListPageClient() {
    return (
        <ProgramGate
            skeleton={<FormVersionsListSkeleton />}
            legacyFallback={<LegacyProgramEmptyState />}
        >
            {programId => <FormVersionsList programId={programId} />}
        </ProgramGate>
    );
}
