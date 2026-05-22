import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { History } from 'lucide-react';

export default function PreviousVersionsEmptyState() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="text-muted-foreground size-5" />
                    No previously published versions yet
                </CardTitle>
                <CardDescription>
                    Once you publish the draft, earlier versions will appear
                    here.
                </CardDescription>
            </CardHeader>
        </Card>
    );
}
