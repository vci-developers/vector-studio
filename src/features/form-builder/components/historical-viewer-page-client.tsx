'use client';

import { useGetUserPermissions } from "@/api/user/hooks/use-get-user-permissions";
import HistoricalViewerSkeleton from "./loading/historical-viewer-skeleton";
import FormErrorBanner from "./error/form-error-banner";
import UgandaProgramEmptyState from "./empty-state/uganda-program-empty-state";
import HistoricalViewer from "./historical-viewer/historical-viewer";

// TODO: This is the seeded legacy form structure. Remove this gate once it migrates.
const UGANDA_PROGRAM_ID = 1;

interface HistoricalViewerPageClientProps {
    version: string;
}

export default function HistoricalViewerPageClient({
    version,
}: HistoricalViewerPageClientProps) {
    const {
        data: getUserPermissionsResult,
        isPending: isGetUserPermissionsPending,
        refetch: refetchUserPermissions,
    } = useGetUserPermissions();

    if (!getUserPermissionsResult || isGetUserPermissionsPending) {
        return <HistoricalViewerSkeleton />;
    }

    if (!getUserPermissionsResult.ok) {
        return (
            <FormErrorBanner
                title="We couldn't load your permissions"
                error={getUserPermissionsResult.error}
                onRetry={() => {
                    void refetchUserPermissions();
                }}
            />
        );
    }

    const { programId } = getUserPermissionsResult.data;

    if (programId === UGANDA_PROGRAM_ID) {
        return <UgandaProgramEmptyState />;
    }

    return <HistoricalViewer programId={programId} version={version} />;
}