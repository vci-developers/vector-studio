import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default function UgandaProgramEmptyState() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Form builder isn&apos;t available for your program
                </CardTitle>
                <CardDescription>
                    Your program is still on the legacy surveillance form. The
                    dynamic form builder will be enabled once your program
                    migrates — reach out to the VectorStudio team if you need
                    changes to your form in the meantime.
                </CardDescription>
            </CardHeader>
        </Card>
    );
}
