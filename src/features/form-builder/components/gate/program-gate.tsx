'use client';

import { useGetUserPermissions } from '@/api/user/hooks/use-get-user-permissions';
import FormBuilderErrorBanner from '../error/form-builder-error-banner';
import UgandaProgramEmptyState from '../empty-state/uganda-program-empty-state';

// TODO: This is the seeded legacy form structure. Remove this gate once it migrates.
const UGANDA_PROGRAM_ID = 1;

interface ProgramGateProps {
    skeleton: React.ReactNode;
    children: (programId: number) => React.ReactNode;
}

export default function ProgramGate({ skeleton, children }: ProgramGateProps) {
    const {
        data: getUserPermissionsResult,
        isPending: isGetUserPermissionsPending,
        refetch: refetchUserPermissions,
    } = useGetUserPermissions();

    if (!getUserPermissionsResult || isGetUserPermissionsPending) {
        return skeleton;
    }

    if (!getUserPermissionsResult.ok) {
        return (
            <FormBuilderErrorBanner
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

    return children(programId);
}
