'use client';

import FormVersionsListSkeleton from '@/features/form-builder/form-versions-list/components/loading/form-versions-list-skeleton';
import FormVersionsList from './versions-list/form-versions-list';
import ProgramGate from '../../components/gate/program-gate';

export default function FormVersionsListPageClient() {
    return (
        <ProgramGate skeleton={<FormVersionsListSkeleton />}>
            {programId => <FormVersionsList programId={programId} />}
        </ProgramGate>
    );
}
