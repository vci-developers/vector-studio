import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import FormVersionsSection from './form-versions-section';
import { Button } from '@/components/ui/button';
import { PencilLine } from 'lucide-react';
import Link from 'next/link';

export default function DraftVersionSection() {
    return (
        <FormVersionsSection label="Draft">
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle>Working draft</CardTitle>
                            <CardDescription>
                                Edit questions, follow-ups, and visibility
                                rules. Changes save automatically as you go.
                            </CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/forms/draft">
                                <PencilLine />
                                Edit draft
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
            </Card>
        </FormVersionsSection>
    );
}
