import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PublishDiffSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
            </div>
            <Card className="gap-0 p-0">
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className="flex items-start gap-3 border-l-4 border-l-transparent px-4 py-3.5"
                    >
                        <Skeleton className="size-5 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-64" />
                            <Skeleton className="h-3 w-44" />
                        </div>
                    </div>
                ))}
            </Card>
        </div>
    );
}
