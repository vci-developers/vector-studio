import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface HistoricalViewerShellProps {
    children: React.ReactNode;
}

export default function HistoricalViewerShell({
    children,
}: HistoricalViewerShellProps) {
    return (
        <div className="mx-auto w-full max-w-3xl space-y-6 py-8">
            <Link
                href="/forms"
                className="text-muted-foreground hover:text-foreground focus-visible:text-foreground focus-visible:outline-ring/60 inline-flex items-center gap-1 rounded-sm text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                <ChevronLeft className="size-3.5" />
                All forms
            </Link>
            <header className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Form version
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Compare this published version against your current draft.
                    Check out to replace your draft with this version.
                </p>
            </header>
            {children}
        </div>
    )
}