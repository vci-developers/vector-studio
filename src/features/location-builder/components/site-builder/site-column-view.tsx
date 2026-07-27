'use client';

import type { LocationType } from '@/api/location-type/contracts/location-type-schema';
import type { Site } from '@/api/site/contracts/site-schema';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import NoSitesEmptyState from '@/features/location-builder/components/empty-state/no-sites-empty-state';
import { Fragment, useState } from 'react';
import SiteColumn from './site-column';

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
    const [selectedSiteIdPath, setSelectedSiteIdPath] = useState<number[]>([]);

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

    function selectSiteAtColumnDepth(columnDepth: number, siteId: number) {
        setSelectedSiteIdPath(currentPath => [
            ...currentPath.slice(0, columnDepth),
            siteId,
        ]);
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
                    <Card className="gap-0 p-0">
                        <div className="divide-border flex h-96 divide-x overflow-x-auto">
                            {siteColumns.map((sitesInColumn, columnDepth) => {
                                const columnParentSiteId =
                                    selectedSiteIdPath[columnDepth - 1] ?? null;
                                const columnParentSite = accessibleSites.find(
                                    site => site.siteId === columnParentSiteId,
                                );
                                const columnLocationType = columnParentSite
                                    ? orderedLocationTypes[
                                          orderedLocationTypes.findIndex(
                                              locationType =>
                                                  locationType.id ===
                                                  columnParentSite.locationTypeId,
                                          ) + 1
                                      ]
                                    : orderedLocationTypes[0];
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
                                        onSelectSite={siteId =>
                                            selectSiteAtColumnDepth(
                                                columnDepth,
                                                siteId,
                                            )
                                        }
                                    />
                                );
                            })}
                        </div>
                    </Card>
                </Fragment>
            )}
        </section>
    );
}
