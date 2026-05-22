import { Skeleton } from '@/components/ui/skeleton';

export default function FormVersionsListSkeleton() {
    return (
        <div className="space-y-8">
            {[0, 1, 2].map(i => (
                <section key={i} className="space-y-3">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                </section>
            ))}
        </div>
    );
}
