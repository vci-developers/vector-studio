'use client';

import DraftEditorSkeleton from './loading/draft-editor-skeleton';
import DraftEditor from './editor/draft-editor';
import ProgramGate from '@/components/gate/program-gate';
import UgandaProgramEmptyState from '../../components/empty-state/uganda-program-empty-state';

export default function DraftEditorPageClient() {
    return (
        <ProgramGate
            skeleton={<DraftEditorSkeleton />}
            ugandaFallback={<UgandaProgramEmptyState />}
        >
            {programId => <DraftEditor programId={programId} />}
        </ProgramGate>
    );
}
