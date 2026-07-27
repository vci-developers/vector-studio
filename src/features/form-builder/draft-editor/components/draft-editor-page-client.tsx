'use client';

import DraftEditorSkeleton from './loading/draft-editor-skeleton';
import DraftEditor from './editor/draft-editor';
import ProgramGate from '@/components/gate/program-gate';
import LegacyProgramEmptyState from '../../components/empty-state/legacy-program-empty-state';

export default function DraftEditorPageClient() {
    return (
        <ProgramGate
            skeleton={<DraftEditorSkeleton />}
            legacyFallback={<LegacyProgramEmptyState />}
        >
            {programId => <DraftEditor programId={programId} />}
        </ProgramGate>
    );
}
