import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default function LegacyProgramEmptyState() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Location levels aren&apos;t available for your program
                </CardTitle>
                <CardDescription>
                    Your program is still on the legacy flat location schema.
                    The location hierarchy builder will be enabled once your
                    program migrates — reach out to the VectorStudio team if you
                    need changes in the meantime.
                </CardDescription>
            </CardHeader>
        </Card>
    );
}
