import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CurrentVersionSkeleton() {
    return (
        <Card className="gap-0 p-0">
            <div className="flex items-center gap-4 px-4 py-3.5">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="size-4 shrink-0" />
            </div>
        </Card>
    );
}
