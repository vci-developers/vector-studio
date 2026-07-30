'use client';

import type { LocationType } from '@/api/location-type/contracts/location-type-schema';
import { usePostSite } from '@/api/site/hooks/use-post-site';
import { networkErrorMessage } from '@/lib/network/network-error';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
    addSiteFormSchema,
    type AddSiteFormInput,
} from '../../validation/add-site-form-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, FieldError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AddSiteFormProps {
    programId: number;
    newSiteLocationType: LocationType;
    parentSiteId: number | null;
}

export default function AddSiteForm({
    programId,
    newSiteLocationType,
    parentSiteId,
}: AddSiteFormProps) {
    const { mutateAsync: createSiteForProgram } = usePostSite();

    const addSiteForm = useForm<AddSiteFormInput>({
        resolver: zodResolver(addSiteFormSchema),
        defaultValues: { name: '' },
    });

    async function onSubmit(data: AddSiteFormInput) {
        const createSiteForProgramResult = await createSiteForProgram({
            programId,
            locationTypeId: newSiteLocationType.id,
            parentId: parentSiteId ?? undefined,
            name: data.name,
            isActive: false,
        });
        if (!createSiteForProgramResult.ok) {
            toast.error("Couldn't create site", {
                description: networkErrorMessage(
                    createSiteForProgramResult.error,
                ),
            });
            return;
        }
        toast.success('New site created successfully');
        addSiteForm.reset();
    }

    return (
        <form onSubmit={addSiteForm.handleSubmit(onSubmit)}>
            <Controller
                name="name"
                control={addSiteForm.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <div className="flex items-center gap-1">
                            <Input
                                {...field}
                                aria-invalid={fieldState.invalid}
                                aria-label={`New ${newSiteLocationType.name} name`}
                                placeholder={`Add a ${newSiteLocationType.name}`}
                                className="h-8 flex-1"
                            />
                            <Button
                                type="submit"
                                variant="outline"
                                size="icon-sm"
                                disabled={addSiteForm.formState.isSubmitting}
                                aria-label={`Add ${newSiteLocationType.name}`}
                            >
                                {addSiteForm.formState.isSubmitting ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <Plus />
                                )}
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
