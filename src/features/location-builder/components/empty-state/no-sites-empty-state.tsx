import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export default function NoSitesEmptyState() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="text-muted-foreground size-5" />
                    No sites yet
                </CardTitle>
                <CardDescription>
                    Sites you can manage appear here as columns, one per level.
                    None have been assigned to you yet.
                </CardDescription>
            </CardHeader>
        </Card>
    );
}
