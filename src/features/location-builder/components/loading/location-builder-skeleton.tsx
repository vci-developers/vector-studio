import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function LocationBuilderSkeleton() {
    return (
        <div className="space-y-8">
            <section className="space-y-2.5">
                <Skeleton className="h-4 w-28" />
                <Card className="divide-border gap-0 divide-y p-0">
                    {[0, 1, 2].map(rowIndex => (
                        <div
                            key={rowIndex}
                            className="flex items-center gap-3 px-4 py-3"
                        >
                            <Skeleton className="size-8 shrink-0" />
                            <Skeleton className="h-4 w-6 shrink-0" />
                            <Skeleton className="h-8 flex-1" />
                            <Skeleton className="size-8 shrink-0" />
                        </div>
                    ))}
                </Card>
                <Skeleton className="h-9 w-full" />
            </section>
        </div>
    );
}
