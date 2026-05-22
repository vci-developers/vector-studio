import { History } from 'lucide-react';

export default function PreviousVersionsEmptyState() {
    return (
        <div className="border-border bg-muted/30 rounded-lg border border-dashed p-6 text-center">
            <History className="text-muted-foreground mx-auto size-5" />
            <p className="mt-3 text-sm font-medium">
                No previously published versions yet
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
                Once you publish the draft, earlier versions will appear here.
            </p>
        </div>
    );
}
