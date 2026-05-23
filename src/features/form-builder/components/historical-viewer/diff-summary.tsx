interface DiffSummaryProps {
    summary: {
        added: number;
        removed: number;
        modified: number;
        unchanged: number;
    };
}

export default function DiffSummary({ summary }: DiffSummaryProps) {
    const totalChanges = summary.added + summary.removed + summary.modified;

    return (
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="text-muted-foreground">
                {totalChanges === 0
                    ? 'No changes against your draft'
                    : 'Changes against your draft:'}
            </span>
            <span className="bg-success/15 text-success inline-flex items-center gap-1 rounded-full px-2 py-0.5">
                +{summary.added} added
            </span>
            <span className="bg-destructive/15 text-destructive inline-flex items-center gap-1 rounded-full px-2 py-0.5">
                -{summary.removed} removed
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                ±{summary.modified} modified
            </span>
            <span className="text-muted-foreground bg-muted/60 inline-flex items-center gap-1 rounded-full px-2 py-0.5">
                {summary.unchanged} unchanged
            </span>
        </div>
    );
}
