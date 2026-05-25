'use client';

import DraftEditorSkeleton from './loading/draft-editor-skeleton';
import DraftEditor from './editor/draft-editor';
import ProgramGate from '../../components/gate/program-gate';

export default function DraftEditorPageClient() {
    return (
        <ProgramGate skeleton={<DraftEditorSkeleton />}>
            {programId => <DraftEditor programId={programId} />}
        </ProgramGate>
    );
}
