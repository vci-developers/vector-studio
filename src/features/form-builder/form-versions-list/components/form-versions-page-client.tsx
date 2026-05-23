'use client';

import { useGetUserPermissions } from '@/api/user/hooks/use-get-user-permissions';
import FormBuilderErrorBanner from '@/features/form-builder/components/error/form-builder-error-banner';
import FormVersionsListSkeleton from '@/features/form-builder/form-versions-list/components/loading/form-versions-list-skeleton';
import UgandaProgramEmptyState from '@/features/form-builder/components/empty-state/uganda-program-empty-state';
import FormVersionsList from './versions-list/form-versions-list';

// TODO: This is the seeded legacy form structure. Remove this gate once it migrates.
const UGANDA_PROGRAM_ID = 1;

export default function FormVersionsPageClient() {
    const {
        data: getUserPermissionsResult,
        isPending: isGetUserPermissionsPending,
        refetch: refetchUserPermissions,
    } = useGetUserPermissions();

    if (!getUserPermissionsResult || isGetUserPermissionsPending)
        return <FormVersionsListSkeleton />;

    if (!getUserPermissionsResult.ok)
        return (
            <FormBuilderErrorBanner
                title="We couldn't load your permissions"
                error={getUserPermissionsResult?.error ?? { kind: 'unknown' }}
                onRetry={() => {
                    void refetchUserPermissions();
                }}
            />
        );

    const { programId } = getUserPermissionsResult.data;

    if (programId === UGANDA_PROGRAM_ID) {
        return <UgandaProgramEmptyState />;
    }

    return <FormVersionsList programId={programId} />;
}
