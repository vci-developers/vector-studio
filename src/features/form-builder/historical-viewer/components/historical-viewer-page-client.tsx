import HistoricalViewerSkeleton from './loading/historical-viewer-skeleton';
import HistoricalViewer from './viewer/historical-viewer';
import ProgramGate from '../../components/gate/program-gate';

interface HistoricalViewerPageClientProps {
    version: string;
}

export default function HistoricalViewerPageClient({
    version,
}: HistoricalViewerPageClientProps) {
    return (
        <ProgramGate skeleton={<HistoricalViewerSkeleton />}>
            {programId => (
                <HistoricalViewer programId={programId} version={version} />
            )}
        </ProgramGate>
    );
}
