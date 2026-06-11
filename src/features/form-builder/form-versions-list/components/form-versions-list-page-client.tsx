'use client';

import FormVersionsListSkeleton from '@/features/form-builder/form-versions-list/components/loading/form-versions-list-skeleton';
import FormVersionsList from './versions-list/form-versions-list';
import ProgramGate from '@/components/gate/program-gate';
import UgandaProgramEmptyState from '../../components/empty-state/uganda-program-empty-state';

export default function FormVersionsListPageClient() {
    return (
        <ProgramGate
            skeleton={<FormVersionsListSkeleton />}
            ugandaFallback={<UgandaProgramEmptyState />}
        >
            {programId => <FormVersionsList programId={programId} />}
        </ProgramGate>
    );
}
