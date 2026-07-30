'use client';

import type { LocationType } from '@/api/location-type/contracts/location-type-schema';
import { usePutLocationTypeByProgramId } from '@/api/location-type/hooks/use-put-location-type-by-program-id';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { networkErrorMessage } from '@/lib/network/network-error';
import { cn } from '@/utils/cn';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Loader2, Lock, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface LocationTypeRowProps {
    locationType: LocationType;
    displayPosition: number;
    hasSites: boolean;
    programId: number;
    onDeleteLocationType: (locationType: LocationType) => void;
}

export default function LocationTypeRow({
    locationType,
    displayPosition,
    hasSites,
    programId,
    onDeleteLocationType,
}: LocationTypeRowProps) {
    const {
        mutate: updateLocationTypeForProgram,
        isPending: isUpdatingLocationTypeForProgram,
    } = usePutLocationTypeByProgramId();

    const [nameDraft, setNameDraft] = useState(locationType.name);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: locationType.id, disabled: hasSites });

    function commitRename() {
        const trimmedName = nameDraft.trim();
        if (trimmedName === '' || trimmedName === locationType.name) {
            setNameDraft(locationType.name);
            return;
        }
        updateLocationTypeForProgram(
            {
                programId,
                locationTypeId: locationType.id,
                requestBody: { name: trimmedName },
            },
            {
                onSuccess: putLocationTypeByProgramIdResult => {
                    if (!putLocationTypeByProgramIdResult.ok) {
                        toast.error("Couldn't rename level", {
                            description: networkErrorMessage(
                                putLocationTypeByProgramIdResult.error,
                            ),
                        });
                        setNameDraft(locationType.name);
                        return;
                    }
                    toast.success('Level renamed');
                },
                onError: () => {
                    toast.error("Couldn't rename level", {
                        description:
                            'A network error occurred. Please try again.',
                    });
                    setNameDraft(locationType.name);
                },
            },
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            className={cn(
                'bg-card flex items-center gap-3 px-4 py-3',
                isDragging && 'opacity-60',
            )}
        >
            {hasSites ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="text-muted-foreground flex size-8 items-center justify-center">
                            <Lock className="size-4" />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        This level has sites and can&apos;t be moved or removed.
                    </TooltipContent>
                </Tooltip>
            ) : (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-grab active:cursor-grabbing"
                    aria-label={`Reorder ${locationType.name}`}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical />
                </Button>
            )}
            <span className="text-muted-foreground w-6 shrink-0 text-sm tabular-nums">
                {displayPosition}
            </span>
            <Input
                value={nameDraft}
                onChange={event => setNameDraft(event.target.value)}
                onBlur={commitRename}
                onKeyDown={event => {
                    if (event.key === 'Enter') {
                        event.currentTarget.blur();
                    } else if (event.key === 'Escape') {
                        setNameDraft(locationType.name);
                    }
                }}
                disabled={isUpdatingLocationTypeForProgram}
                aria-label={`Level ${displayPosition} name`}
                className="h-8 flex-1"
            />
            {isUpdatingLocationTypeForProgram && (
                <Loader2 className="text-muted-foreground size-4 animate-spin" />
            )}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={hasSites}
                        onClick={() => onDeleteLocationType(locationType)}
                        aria-label={`Delete ${locationType.name}`}
                    >
                        <Trash2 />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    {hasSites
                        ? "This level has sites and can't be deleted."
                        : 'Delete level'}
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
