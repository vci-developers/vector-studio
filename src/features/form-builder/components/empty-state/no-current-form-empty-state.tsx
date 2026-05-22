import { FileText } from 'lucide-react';

export default function NoCurrentFormEmptyState() {
    return (
        <div className="border-border bg-muted/30 rounded-lg border border-dashed p-6 text-center">
            <FileText className="text-muted-foreground mx-auto size-5" />
            <p className="mt-3 text-sm font-medium">
                No form is currently published
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
                Publish your first draft to make it the active form your field
                workers see.
            </p>
        </div>
    );
}
