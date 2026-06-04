import type { LocationType } from '@/api/location-type/contracts/location-type-schema';
import { usePostLocationTypeToProgram } from '@/api/location-type/hooks/use-post-location-type-to-program';
import { networkErrorMessage } from '@/lib/network/network-error';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
    addLocationLevelFormSchema,
    type AddLocationLevelFormInput,
} from '../../validation/add-location-level-form-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, FieldError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AddLocationLevelFormProps {
    programId: number;
    locationTypes: LocationType[];
}

export default function AddLocationLevelForm({
    programId,
    locationTypes,
}: AddLocationLevelFormProps) {
    const { mutateAsync: createLocationTypeForProgram } =
        usePostLocationTypeToProgram();

    const addLocationLevelForm = useForm<AddLocationLevelFormInput>({
        resolver: zodResolver(addLocationLevelFormSchema),
        defaultValues: { name: '' },
    });

    const nextLevel =
        locationTypes.length > 0
            ? Math.max(
                  ...locationTypes.map(locationType => locationType.level),
              ) + 1
            : 1;

    async function onSubmit(data: AddLocationLevelFormInput) {
        const createLocationTypeForProgramResult =
            await createLocationTypeForProgram({
                programId,
                requestBody: { name: data.name, level: nextLevel },
            });
        if (!createLocationTypeForProgramResult.ok) {
            toast.error("Couldn't create location level", {
                description: networkErrorMessage(
                    createLocationTypeForProgramResult.error,
                ),
            });
            return;
        }
        toast.success('New location level created successfully');
        addLocationLevelForm.reset();
    }

    return (
        <form onSubmit={addLocationLevelForm.handleSubmit(onSubmit)}>
            <Controller
                name="name"
                control={addLocationLevelForm.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <div className="flex items-center gap-2">
                            <Input
                                {...field}
                                id="add-location-level-name"
                                aria-invalid={fieldState.invalid}
                                aria-label="New level name"
                                placeholder="Add a level (e.g. Village)"
                                className="h-9 flex-1"
                            />
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                disabled={
                                    addLocationLevelForm.formState.isSubmitting
                                }
                            >
                                {addLocationLevelForm.formState.isSubmitting ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <Plus />
                                )}
                                Add level
                            </Button>
                        </div>
                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />
        </form>
    );
}
