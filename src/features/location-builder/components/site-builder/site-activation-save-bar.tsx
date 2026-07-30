import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface SiteActivationSaveBarProps {
    pendingUpdateCount: number;
    isSaving: boolean;
    onDiscard: () => void;
    onSave: () => void;
}

export default function SiteActivationSaveBar({
    pendingUpdateCount,
    isSaving,
    onDiscard,
    onSave,
}: SiteActivationSaveBarProps) {
    const pendingUpdateLabel =
        pendingUpdateCount === 1
            ? '1 unsaved activation change'
            : `${pendingUpdateCount} unsaved activation changes`;

    return (
        <Card className="flex-row items-center justify-between gap-4 px-4 py-3">
            <span aria-live="polite" className="text-sm font-medium">
                {isSaving ? 'Saving activation changes…' : pendingUpdateLabel}
            </span>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onDiscard}
                    disabled={isSaving}
                >
                    Discard
                </Button>
                <Button type="button" onClick={onSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="animate-spin" />}
                    Save changes
                </Button>
            </div>
        </Card>
    );
}
