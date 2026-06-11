import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Layers } from 'lucide-react';

export default function NoLevelsEmptyState() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Layers className="text-muted-foreground size-5" />
                    No levels yet
                </CardTitle>
                <CardDescription>
                    Start by adding Level 1 (for example
                    &ldquo;District&rdquo;). Add each level top-down to build
                    your program&apos;s location hierarchy.
                </CardDescription>
            </CardHeader>
        </Card>
    );
}
