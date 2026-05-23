import { Card } from '@/components/ui/card';
import VersionsSection from './versions-section';
import { PencilLine } from 'lucide-react';
import Link from 'next/link';

export default function DraftVersionSection() {
    return (
        <VersionsSection label="Draft">
            <Card className="gap-0 p-0">
                <Link
                    href="/forms/draft"
                    className="group hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-ring/60 flex items-center gap-4 px-4 py-3.5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
                >
                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-sm font-medium">Working draft</div>
                        <div className="text-muted-foreground text-xs leading-relaxed">
                            Edit questions, follow-ups, and visibility rules.
                            Changes save automatically.
                        </div>
                    </div>
                    <div className="text-primary inline-flex shrink-0 items-center gap-1.5 text-sm font-medium group-hover:underline">
                        <PencilLine className="size-3.5" />
                        Edit draft
                    </div>
                </Link>
            </Card>
        </VersionsSection>
    );
}
