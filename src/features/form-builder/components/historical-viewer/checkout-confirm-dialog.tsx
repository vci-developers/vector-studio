'use client';

import type { Form } from '@/api/form/contracts/form-schema';
import { useCheckoutFormVersionForProgram } from '@/api/form/hooks/use-checkout-form-version-for-program';
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
import { useRouter } from 'next/navigation';
import { Fragment } from 'react';
import { toast } from 'sonner';

interface CheckoutConfirmDialogProps {
    formToCheckout: Form | null;
    programId: number;
    onClose: () => void;
}

export default function CheckoutConfirmDialog({
    formToCheckout,
    programId,
    onClose,
}: CheckoutConfirmDialogProps) {
    const router = useRouter();
    const {
        mutate: checkoutFormVersionForProgram,
        isPending: isCheckoutFormVersionForProgramPending,
    } = useCheckoutFormVersionForProgram();

    function confirmCheckout() {
        if (!formToCheckout) return;
        checkoutFormVersionForProgram(
            { programId, version: formToCheckout.version },
            {
                onSuccess: result => {
                    if (!result.ok) {
                        toast.error("Couldn't check out this version", {
                            description: networkErrorMessage(result.error),
                        });
                        return;
                    }
                    toast.success(
                        `Draft replaced with version ${formToCheckout.version}`,
                    );
                    onClose();
                    router.push('/forms/draft');
                },
                onError: () => {
                    toast.error("Couldn't check out this version", {
                        description:
                            'A network error occurred. Please try again.',
                    });
                },
            },
        );
    }

    return (
        <Dialog
            open={formToCheckout !== null}
            onOpenChange={open => {
                if (!open) onClose();
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Replace draft with this version?</DialogTitle>
                    <DialogDescription>
                        {formToCheckout && (
                            <Fragment>
                                Your current draft will be replaced with a copy
                                of{' '}
                                <span className="text-foreground font-medium">
                                    version {formToCheckout.version}
                                </span>
                                . Any unsaved changes in the draft will be lost.
                            </Fragment>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isCheckoutFormVersionForProgramPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={confirmCheckout}
                        disabled={isCheckoutFormVersionForProgramPending}
                    >
                        {isCheckoutFormVersionForProgramPending && (
                            <Loader2 className="animate-spin" />
                        )}
                        Replace draft
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
