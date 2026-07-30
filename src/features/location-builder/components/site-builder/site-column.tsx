'use client';

import type { LocationType } from '@/api/location-type/contracts/location-type-schema';
import type { Site } from '@/api/site/contracts/site-schema';
import { ScrollArea } from '@/components/ui/scroll-area';
import AddSiteForm from './add-site-form';
import SiteRow from './site-row';

interface SiteColumnProps {
    programId: number;
    columnLabel: string;
    sites: Site[];
    selectedSiteId: number | null;
    parentSiteId: number | null;
    newSiteLocationType: LocationType | null;
    activeSiteIds: Set<number>;
    onSelectSite: (siteId: number) => void;
    onToggleSiteActivation: (siteId: number, nextIsActive: boolean) => void;
}

export default function SiteColumn({
    programId,
    columnLabel,
    sites,
    selectedSiteId,
    parentSiteId,
    newSiteLocationType,
    activeSiteIds,
    onSelectSite,
    onToggleSiteActivation,
}: SiteColumnProps) {
    return (
        <div className="flex w-64 shrink-0 flex-col">
            <div className="bg-card text-muted-foreground border-b px-3 py-2 text-xs font-semibold tracking-wide uppercase">
                {columnLabel}
            </div>
            <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-0.5 p-1">
                    {sites.map(site => (
                        <SiteRow
                            key={site.siteId}
                            site={site}
                            showAncestorNames={parentSiteId === null}
                            isSelected={site.siteId === selectedSiteId}
                            isActive={activeSiteIds.has(site.siteId)}
                            onSelect={() => onSelectSite(site.siteId)}
                            onToggleSiteActivation={onToggleSiteActivation}
                        />
                    ))}
                </div>
            </ScrollArea>
            {newSiteLocationType && (
                <div className="border-t p-1">
                    <AddSiteForm
                        programId={programId}
                        newSiteLocationType={newSiteLocationType}
                        parentSiteId={parentSiteId}
                    />
                </div>
            )}
        </div>
    );
}
