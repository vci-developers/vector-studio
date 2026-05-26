import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function NoCurrentFormEmptyState() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="text-muted-foreground size-5" />
                    No form is currently published
                </CardTitle>
                <CardDescription>
                    Publish your draft to make it the active form your field
                    workers see.
                </CardDescription>
            </CardHeader>
        </Card>
    );
}
