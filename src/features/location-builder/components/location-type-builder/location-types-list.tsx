'use client';

import type { LocationType } from '@/api/location-type/contracts/location-type-schema';
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { usePutLocationTypeByProgramId } from '@/api/location-type/hooks/use-put-location-type-by-program-id';
import { toast } from 'sonner';
import { networkErrorMessage } from '@/lib/network/network-error';
import NoLocationTypesEmptyState from '../empty-state/no-location-types-empty-state';
import { Card } from '@/components/ui/card';
import LocationTypeRow from './location-type-row';
import AddLocationTypeForm from './add-location-type-form';
import { useState } from 'react';
import { cn } from '@/utils/cn';

interface LocationTypesListProps {
    programId: number;
    locationTypes: LocationType[];
    firstLevelWithNoSitesIndex: number;
    onDeleteLocationType: (locationType: LocationType) => void;
}

export default function LocationTypesList({
    programId,
    locationTypes,
    firstLevelWithNoSitesIndex,
    onDeleteLocationType,
}: LocationTypesListProps) {
    const { mutateAsync: updateLocationTypeForProgram } =
        usePutLocationTypeByProgramId();
    const [isReordering, setIsReordering] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    async function handleReorder(event: DragEndEvent) {
        if (isReordering) return;

        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const fromIndex = locationTypes.findIndex(
            locationType => locationType.id === active.id,
        );
        const toIndex = locationTypes.findIndex(
            locationType => locationType.id === over.id,
        );
        if (fromIndex === -1 || toIndex === -1) return;

        if (
            fromIndex < firstLevelWithNoSitesIndex ||
            toIndex < firstLevelWithNoSitesIndex
        )
            return;

        const reorderedLocationTypes = arrayMove(
            locationTypes,
            fromIndex,
            toIndex,
        );

        const windowStart = Math.min(fromIndex, toIndex);
        const windowEnd = Math.max(fromIndex, toIndex);

        const updatedLocationLevels: Array<{ id: number; level: number }> = [];
        for (let position = windowStart; position <= windowEnd; position++) {
            const locationTypeBefore = locationTypes[position];
            const locationTypeAfter = reorderedLocationTypes[position];
            if (!locationTypeBefore || !locationTypeAfter) continue;
            if (locationTypeAfter.id !== locationTypeBefore.id) {
                updatedLocationLevels.push({
                    id: locationTypeAfter.id,
                    level: locationTypeBefore.level,
                });
            }
        }
        if (updatedLocationLevels.length === 0) return;

        setIsReordering(true);
        try {
            for (const { id, level } of updatedLocationLevels) {
                const updateLocationTypeByProgramIdResult =
                    await updateLocationTypeForProgram({
                        programId,
                        locationTypeId: id,
                        requestBody: { level },
                    });
                if (!updateLocationTypeByProgramIdResult.ok) {
                    toast.error("Couldn't reorder location levels", {
                        description: networkErrorMessage(
                            updateLocationTypeByProgramIdResult.error,
                        ),
                    });
                    return;
                }
            }
            toast.success('Location levels reordered successfully');
        } catch {
            toast.error("Couldn't reorder location levels", {
                description: 'A network error occurred. Please try again.',
            });
        } finally {
            setIsReordering(false);
        }
    }

    return (
        <section className="space-y-2.5">
            <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                Location levels
            </h2>
            {locationTypes.length === 0 ? (
                <NoLocationTypesEmptyState />
            ) : (
                <Card
                    aria-busy={isReordering}
                    className={cn(
                        'divide-border gap-0 divide-y p-0',
                        isReordering && 'pointer-events-none opacity-60',
                    )}
                >
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleReorder}
                    >
                        <SortableContext
                            items={locationTypes.map(
                                locationType => locationType.id,
                            )}
                            strategy={verticalListSortingStrategy}
                        >
                            {locationTypes.map((locationType, index) => (
                                <LocationTypeRow
                                    key={locationType.id}
                                    locationType={locationType}
                                    displayPosition={index + 1}
                                    hasSites={
                                        index < firstLevelWithNoSitesIndex
                                    }
                                    programId={programId}
                                    onDeleteLocationType={onDeleteLocationType}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </Card>
            )}
            <AddLocationTypeForm
                programId={programId}
                locationTypes={locationTypes}
            />
        </section>
    );
}
