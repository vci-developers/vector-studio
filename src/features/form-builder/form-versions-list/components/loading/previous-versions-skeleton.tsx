import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PreviousVersionsSkeleton() {
    return (
        <Card className="divide-border gap-0 divide-y p-0">
            {[0, 1].map(i => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-52" />
                        <Skeleton className="h-3 w-36" />
                    </div>
                    <Skeleton className="size-4 shrink-0" />
                </div>
            ))}
        </Card>
    );
}
