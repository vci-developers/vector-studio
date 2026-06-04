'use client';

import UgandaProgramEmptyState from '../../components/empty-state/uganda-program-empty-state';
import HistoricalViewerSkeleton from './loading/historical-viewer-skeleton';
import HistoricalViewer from './viewer/historical-viewer';
import ProgramGate from '@/components/gate/program-gate';

interface HistoricalViewerPageClientProps {
    version: string;
}

export default function HistoricalViewerPageClient({
    version,
}: HistoricalViewerPageClientProps) {
    return (
        <ProgramGate
            skeleton={<HistoricalViewerSkeleton />}
            ugandaFallback={<UgandaProgramEmptyState />}
        >
            {programId => (
                <HistoricalViewer programId={programId} version={version} />
            )}
        </ProgramGate>
    );
}
