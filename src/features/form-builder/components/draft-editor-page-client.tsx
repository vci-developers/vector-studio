'use client';

import { useGetUserPermissions } from '@/api/user/hooks/use-get-user-permissions';
import DraftEditorSkeleton from './loading/draft-editor-skeleton';
import FormErrorBanner from './error/form-error-banner';
import UgandaProgramEmptyState from './empty-state/uganda-program-empty-state';
import DraftEditor from './draft-editor/draft-editor';

// TODO: This is the seeded legacy form structure. Remove this gate once it migrates.
const UGANDA_PROGRAM_ID = 1;

export default function DraftEditorPageClient() {
    const {
        data: getUserPermissionsResult,
        isPending: isGetUserPermissionsPending,
        refetch: refetchUserPermissions,
    } = useGetUserPermissions();

    if (!getUserPermissionsResult || isGetUserPermissionsPending) {
        return <DraftEditorSkeleton />;
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

    return <DraftEditor programId={programId} />;
}
