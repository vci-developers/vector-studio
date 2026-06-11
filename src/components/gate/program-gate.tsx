'use client';

import type { UserPermissions } from '@/api/user/contracts/user-permissions-schema';
import { useGetUserPermissions } from '@/api/user/hooks/use-get-user-permissions';
import ErrorBanner from '../error/error-banner';

// TODO: The legacy Uganda program uses the seeded flat schema. Remove this gate
// once it migrates.
const UGANDA_PROGRAM_ID = 1;

interface ProgramGateProps {
    skeleton: React.ReactNode;
    ugandaFallback: React.ReactNode;
    children: (
        programId: number,
        permissions: UserPermissions,
    ) => React.ReactNode;
}

export default function ProgramGate({
    skeleton,
    ugandaFallback,
    children,
}: ProgramGateProps) {
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
            <ErrorBanner
                title="We couldn't load your permissions"
                error={getUserPermissionsResult.error}
                onRetry={refetchUserPermissions}
            />
        );
    }

    const { programId, permissions } = getUserPermissionsResult.data;

    if (programId === UGANDA_PROGRAM_ID) {
        return ugandaFallback;
    }

    return children(programId, permissions);
}
