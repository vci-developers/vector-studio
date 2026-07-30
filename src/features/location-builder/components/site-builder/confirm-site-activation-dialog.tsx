import type { Site } from '@/api/site/contracts/site-schema';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmSiteActivationDialogProps {
    siteActivationUpdates: Site[];
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmSiteActivationDialog({
    siteActivationUpdates,
    isOpen,
    onConfirm,
    onCancel,
}: ConfirmSiteActivationDialogProps) {
    const sitesToDeactivateCount = siteActivationUpdates.filter(
        site => site.isActive,
    ).length;
    const sitesToActivateCount = siteActivationUpdates.filter(
        site => !site.isActive,
    ).length;
    const sitesWithCollectedDataCount = siteActivationUpdates.filter(
        site => site.hasData,
    ).length;

    const siteDeactivationSummary =
        sitesToDeactivateCount === 1
            ? '1 site will stop collecting data'
            : `${sitesToDeactivateCount} sites will stop collecting data`;
    const siteActivationSummary =
        sitesToActivateCount === 1
            ? '1 site will start collecting data'
            : `${sitesToActivateCount} sites will start collecting data`;
    const collectedDataSummary =
        sitesWithCollectedDataCount === 1
            ? '1 of them holds collected data'
            : `${sitesWithCollectedDataCount} of them hold collected data`;

    return (
        <Dialog
            open={isOpen}
            onOpenChange={open => {
                if (!open) onCancel();
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save activation changes?</DialogTitle>
                    <DialogDescription>
                        This applies every staged activation change at once.
                    </DialogDescription>
                </DialogHeader>
                <ul className="text-muted-foreground space-y-1.5 text-sm">
                    {sitesToDeactivateCount > 0 && (
                        <li>{siteDeactivationSummary}</li>
                    )}
                    {sitesToActivateCount > 0 && (
                        <li>{siteActivationSummary}</li>
                    )}
                    {sitesWithCollectedDataCount > 0 && (
                        <li>{collectedDataSummary}</li>
                    )}
                </ul>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={onConfirm}>
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
