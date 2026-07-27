'use client';

import type { LocationType } from '@/api/location-type/contracts/location-type-schema';
import type { Site } from '@/api/site/contracts/site-schema';
import { usePutSite } from '@/api/site/hooks/use-put-site';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import NoSitesEmptyState from '@/features/location-builder/components/empty-state/no-sites-empty-state';
import { cascadeSiteActivationToggle } from '@/features/location-builder/utils/cascade-site-activation-toggle';
import { computeSiteActivationUpdates } from '@/features/location-builder/utils/compute-site-activation-updates';
import { networkErrorMessage } from '@/lib/network/network-error';
import { cn } from '@/utils/cn';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import ConfirmSiteActivationDialog from './confirm-site-activation-dialog';
import SiteActivationSaveBar from './site-activation-save-bar';
import SiteColumn from './site-column';
import { useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/api/user/user-keys';

interface SiteColumnViewProps {
    programId: number;
    accessibleSites: Site[];
    orderedLocationTypes: LocationType[];
    canWriteSiteMetadata: boolean;
}

export default function SiteColumnView({
    programId,
    accessibleSites,
    orderedLocationTypes,
    canWriteSiteMetadata,
}: SiteColumnViewProps) {
    const queryClient = useQueryClient();
    const { mutateAsync: updateSite } = usePutSite();

    const [selectedSiteIdPath, setSelectedSiteIdPath] = useState<number[]>([]);
    const [stagedActiveSiteIds, setStagedActiveSiteIds] =
        useState<Set<number> | null>(null);
    const [isConfirmingSiteActivation, setIsConfirmingSiteActivation] =
        useState(false);
    const [isSavingSiteActivation, setIsSavingSiteActivation] = useState(false);

    const accessibleSiteIds = new Set(accessibleSites.map(site => site.siteId));
    const sitesSortedByName = [...accessibleSites].sort(
        (firstSite, secondSite) =>
            (firstSite.name ?? '').localeCompare(secondSite.name ?? ''),
    );
    const accessibleRootSites = sitesSortedByName.filter(
        site => site.parentId == null || !accessibleSiteIds.has(site.parentId),
    );
    const siteColumns = [
        accessibleRootSites,
        ...selectedSiteIdPath.map(selectedSiteId =>
            sitesSortedByName.filter(site => site.parentId === selectedSiteId),
        ),
    ];
    const selectedSiteHierarchyNames = Object.values(
        accessibleSites.find(site => site.siteId === selectedSiteIdPath.at(-1))
            ?.locationHierarchy ?? {},
    );
    const canCreateRootSite =
        canWriteSiteMetadata && orderedLocationTypes.length > 0;

    const serverActiveSiteIds = new Set(
        accessibleSites.filter(site => site.isActive).map(site => site.siteId),
    );
    const activeSiteIds = stagedActiveSiteIds ?? serverActiveSiteIds;
    const siteActivationUpdates = computeSiteActivationUpdates(
        accessibleSites,
        activeSiteIds,
    );

    function selectSiteAtColumnDepth(columnDepth: number, siteId: number) {
        setSelectedSiteIdPath(currentPath => [
            ...currentPath.slice(0, columnDepth),
            siteId,
        ]);
    }

    function toggleSiteActivation(siteId: number, nextIsActive: boolean) {
        setStagedActiveSiteIds(
            cascadeSiteActivationToggle(
                accessibleSites,
                activeSiteIds,
                siteId,
                nextIsActive,
            ),
        );
    }

    async function saveStagedSiteActivation() {
        if (isSavingSiteActivation) return;

        setIsConfirmingSiteActivation(false);
        setIsSavingSiteActivation(true);

        for (const siteToUpdate of siteActivationUpdates) {
            const updateSiteResult = await updateSite({
                siteId: siteToUpdate.siteId,
                requestBody: { isActive: !siteToUpdate.isActive },
                skipPermissionsRefetch: true,
            }).catch(() => null);

            if (!updateSiteResult?.ok) {
                toast.error("Couldn't finish saving activation changes", {
                    description: updateSiteResult
                        ? networkErrorMessage(updateSiteResult.error)
                        : 'A network error occurred. Please try again.',
                });
                queryClient.invalidateQueries({
                    queryKey: userKeys.permissions(),
                });
                setIsSavingSiteActivation(false);
                return;
            }
        }

        await queryClient.invalidateQueries({
            queryKey: userKeys.permissions(),
        });
        setStagedActiveSiteIds(null);
        setIsSavingSiteActivation(false);
        toast.success('Activation changes saved');
    }

    return (
        <section className="space-y-2.5">
            <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                Sites
            </h2>
            {accessibleRootSites.length === 0 && !canCreateRootSite ? (
                <NoSitesEmptyState />
            ) : (
                <Fragment>
                    {selectedSiteHierarchyNames.length > 0 && (
                        <Breadcrumb>
                            <BreadcrumbList>
                                {selectedSiteHierarchyNames
                                    .slice(0, -1)
                                    .map((ancestorName, ancestorIndex) => (
                                        <Fragment
                                            key={`${ancestorIndex}-${ancestorName}`}
                                        >
                                            <BreadcrumbItem>
                                                {ancestorName}
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator />
                                        </Fragment>
                                    ))}
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        {selectedSiteHierarchyNames.at(-1)}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    )}
                    <Card
                        inert={isSavingSiteActivation}
                        className={cn(
                            'gap-0 p-0',
                            isSavingSiteActivation && 'opacity-60',
                        )}
                    >
                        <div className="divide-border flex h-96 divide-x overflow-x-auto">
                            {siteColumns.map((sitesInColumn, columnDepth) => {
                                const columnParentSiteId =
                                    selectedSiteIdPath[columnDepth - 1] ?? null;
                                const columnParentSite = accessibleSites.find(
                                    site => site.siteId === columnParentSiteId,
                                );
                                const columnParentLevelIndex =
                                    orderedLocationTypes.findIndex(
                                        locationType =>
                                            locationType.id ===
                                            columnParentSite?.locationTypeId,
                                    );
                                const columnLocationType =
                                    columnParentSiteId !== null &&
                                    columnParentLevelIndex === -1
                                        ? undefined
                                        : orderedLocationTypes[
                                              columnParentLevelIndex + 1
                                          ];
                                const newSiteLocationType =
                                    columnLocationType &&
                                    (columnParentSite || canCreateRootSite)
                                        ? columnLocationType
                                        : null;
                                const columnLabel =
                                    columnDepth === 0
                                        ? 'Your trees'
                                        : (columnLocationType?.name ?? 'Sites');

                                if (
                                    sitesInColumn.length === 0 &&
                                    !newSiteLocationType
                                ) {
                                    return null;
                                }

                                return (
                                    <SiteColumn
                                        key={
                                            columnParentSiteId ??
                                            'accessible-roots'
                                        }
                                        programId={programId}
                                        columnLabel={columnLabel}
                                        sites={sitesInColumn}
                                        selectedSiteId={
                                            selectedSiteIdPath[columnDepth] ??
                                            null
                                        }
                                        parentSiteId={columnParentSiteId}
                                        newSiteLocationType={
                                            newSiteLocationType
                                        }
                                        activeSiteIds={activeSiteIds}
                                        onSelectSite={siteId =>
                                            selectSiteAtColumnDepth(
                                                columnDepth,
                                                siteId,
                                            )
                                        }
                                        onToggleSiteActivation={
                                            toggleSiteActivation
                                        }
                                    />
                                );
                            })}
                        </div>
                    </Card>
                    {siteActivationUpdates.length > 0 && (
                        <SiteActivationSaveBar
                            pendingUpdateCount={siteActivationUpdates.length}
                            isSaving={isSavingSiteActivation}
                            onDiscard={() => setStagedActiveSiteIds(null)}
                            onSave={() => setIsConfirmingSiteActivation(true)}
                        />
                    )}
                    <ConfirmSiteActivationDialog
                        siteActivationUpdates={siteActivationUpdates}
                        isOpen={isConfirmingSiteActivation}
                        onConfirm={saveStagedSiteActivation}
                        onCancel={() => setIsConfirmingSiteActivation(false)}
                    />
                </Fragment>
            )}
        </section>
    );
}
