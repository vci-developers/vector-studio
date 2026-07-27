'use client';

import type { Site } from '@/api/site/contracts/site-schema';
import { usePutSite } from '@/api/site/hooks/use-put-site';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { networkErrorMessage } from '@/lib/network/network-error';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SiteRowProps {
    site: Site;
    showAncestorNames: boolean;
    isSelected: boolean;
    isActive: boolean;
    onSelect: () => void;
    onToggleSiteActivation: (siteId: number, nextIsActive: boolean) => void;
}

export default function SiteRow({
    site,
    showAncestorNames,
    isSelected,
    isActive,
    onSelect,
    onToggleSiteActivation,
}: SiteRowProps) {
    const { mutate: updateSite, isPending: isUpdatingSite } = usePutSite();

    const [nameDraft, setNameDraft] = useState(site.name ?? '');

    const ancestorNames = Object.values(site.locationHierarchy ?? {}).slice(
        0,
        -1,
    );

    function commitRename() {
        const trimmedName = nameDraft.trim();
        if (trimmedName === '' || trimmedName === site.name) {
            setNameDraft(site.name ?? '');
            return;
        }
        updateSite(
            {
                siteId: site.siteId,
                requestBody: { name: trimmedName },
            },
            {
                onSuccess: putSiteResult => {
                    if (!putSiteResult.ok) {
                        toast.error("Couldn't rename site", {
                            description: networkErrorMessage(
                                putSiteResult.error,
                            ),
                        });
                        setNameDraft(site.name ?? '');
                        return;
                    }
                    toast.success('Site renamed');
                },
                onError: () => {
                    toast.error("Couldn't rename site", {
                        description:
                            'A network error occurred. Please try again.',
                    });
                    setNameDraft(site.name ?? '');
                },
            },
        );
    }

    return (
        <div
            aria-current={isSelected}
            className={cn(
                'hover:bg-muted/50 flex items-center gap-1 rounded-md py-0.5 pr-1',
                isSelected && 'bg-muted',
            )}
        >
            <div className="flex min-w-0 flex-1 flex-col">
                <Input
                    value={nameDraft}
                    onChange={event => setNameDraft(event.target.value)}
                    onFocus={onSelect}
                    onBlur={commitRename}
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            event.currentTarget.blur();
                        } else if (event.key === 'Escape') {
                            setNameDraft(site.name ?? '');
                        }
                    }}
                    disabled={isUpdatingSite}
                    placeholder="Unnamed site"
                    aria-label={`Name of ${site.name ?? 'unnamed site'}`}
                    className={cn(
                        'hover:border-input h-8 border-transparent bg-transparent px-2 shadow-none dark:bg-transparent',
                        isSelected && 'font-medium',
                    )}
                />
                {showAncestorNames && ancestorNames.length > 0 && (
                    <span className="text-muted-foreground truncate px-2 text-xs">
                        {ancestorNames.join(' / ')}
                    </span>
                )}
            </div>
            {isUpdatingSite && (
                <Loader2 className="text-muted-foreground size-4 animate-spin" />
            )}
            <Switch
                checked={isActive}
                onCheckedChange={nextIsActive =>
                    onToggleSiteActivation(site.siteId, nextIsActive)
                }
                disabled={isUpdatingSite}
                aria-label={`Collect data at ${site.name ?? 'unnamed site'}`}
            />
        </div>
    );
}
