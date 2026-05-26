import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DraftEditorSkeleton() {
    return (
        <div className="space-y-8">
            <Card className="gap-0 p-0">
                <div className="space-y-2 px-5 py-4">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-72" />
                </div>
            </Card>
            <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-32" />
                </div>
                <Card className="divide-border gap-0 divide-y p-0">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className="flex items-center gap-4 px-4 py-3.5"
                        >
                            <Skeleton className="size-6 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-64" />
                                <Skeleton className="h-3 w-44" />
                            </div>
                            <Skeleton className="size-8 shrink-0" />
                        </div>
                    ))}
                </Card>
            </section>
        </div>
    );
}
