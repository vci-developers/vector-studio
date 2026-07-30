'use client';

import type { UserPermissions } from '@/api/user/contracts/user-permissions-schema';
import { useGetUserPermissions } from '@/api/user/hooks/use-get-user-permissions';
import ErrorBanner from '../error/error-banner';
import type { Site } from '@/api/site/contracts/site-schema';

// TODO: The legacy programs use the seeded flat schema. Remove this gate
// once they are migrated.
const KNOWN_LEGACY_PROGRAM_IDS = new Set([1, 2, 4]);

function isLegacyProgram(programId: number, accessibleSites: Site[]): boolean {
    if (KNOWN_LEGACY_PROGRAM_IDS.has(programId)) {
        return true;
    }

    return (
        accessibleSites.length > 0 &&
        accessibleSites.every(
            site => Object.keys(site.locationHierarchy ?? {}).length === 0,
        )
    );
}

interface ProgramGateProps {
    skeleton: React.ReactNode;
    legacyFallback: React.ReactNode;
    children: (
        programId: number,
        permissions: UserPermissions,
    ) => React.ReactNode;
}

export default function ProgramGate({
    skeleton,
    legacyFallback,
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

    if (isLegacyProgram(programId, permissions.sites.canAccessSites)) {
        return legacyFallback;
    }

    return children(programId, permissions);
}
