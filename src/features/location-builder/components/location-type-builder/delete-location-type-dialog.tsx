import type { LocationType } from '@/api/location-type/contracts/location-type-schema';
import { useDeleteLocationTypeFromProgram } from '@/api/location-type/hooks/use-delete-location-type-from-program';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { networkErrorMessage } from '@/lib/network/network-error';
import { Loader2 } from 'lucide-react';
import { Fragment } from 'react';
import { toast } from 'sonner';

interface DeleteLocationTypeDialogProps {
    locationType: LocationType | null;
    programId: number;
    onClose: () => void;
}

export default function DeleteLocationTypeDialog({
    locationType,
    programId,
    onClose,
}: DeleteLocationTypeDialogProps) {
    const {
        mutate: deleteLocationTypeFromProgram,
        isPending: isDeletingLocationTypeFromProgram,
    } = useDeleteLocationTypeFromProgram();

    function confirmDelete() {
        if (!locationType) return;

        deleteLocationTypeFromProgram(
            { programId, locationTypeId: locationType.id },
            {
                onSuccess: deleteLocationTypeFromProgramResult => {
                    if (!deleteLocationTypeFromProgramResult.ok) {
                        toast.error("Couldn't delete location level", {
                            description: networkErrorMessage(
                                deleteLocationTypeFromProgramResult.error,
                            ),
                        });
                        return;
                    }
                    toast.success('Location level deleted');
                    onClose();
                },
                onError: () => {
                    toast.error("Couldn't delete location level", {
                        description:
                            'A network error occurred. Please try again.',
                    });
                },
            },
        );
    }

    return (
        <Dialog
            open={locationType !== null}
            onOpenChange={open => {
                if (!open) onClose();
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete this location level?</DialogTitle>
                    <DialogDescription>
                        <Fragment>
                            This will permanently remove{' '}
                            <span className="text-foreground font-medium">
                                &ldquo;{locationType?.name}&rdquo;
                            </span>{' '}
                            from your program&apos;s hierarchy.
                        </Fragment>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeletingLocationTypeFromProgram}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={confirmDelete}
                        disabled={isDeletingLocationTypeFromProgram}
                    >
                        {isDeletingLocationTypeFromProgram && (
                            <Loader2 className="animate-spin" />
                        )}
                        Delete location level
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
