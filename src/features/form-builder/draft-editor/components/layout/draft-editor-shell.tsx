import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface DraftEditorShellProps {
    children: React.ReactNode;
}

export default function DraftEditorShell({ children }: DraftEditorShellProps) {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 py-8">
            <Link
                href="/forms"
                className="text-muted-foreground hover:text-foreground focus-visible:text-foreground focus-visible:outline-ring/60 inline-flex items-center gap-1 rounded-sm text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                <ChevronLeft className="size-3.5" />
                All forms
            </Link>
            <header className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Edit draft
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Add questions, follow-ups, and dropdown options. Every
                    change saves to the draft automatically.
                </p>
            </header>
            {children}
        </div>
    );
}
