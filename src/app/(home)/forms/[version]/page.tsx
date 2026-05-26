import HistoricalViewerPageClient from '@/features/form-builder/historical-viewer/components/historical-viewer-page-client';
import HistoricalViewerShell from '@/features/form-builder/historical-viewer/components/layout/historical-viewer-shell';

interface FormVersionPageProps {
    params: Promise<{ version: string }>;
}

export default async function FormVersionPage({
    params,
}: FormVersionPageProps) {
    const { version } = await params;
    return (
        <HistoricalViewerShell>
            <HistoricalViewerPageClient version={version} />
        </HistoricalViewerShell>
    );
}
