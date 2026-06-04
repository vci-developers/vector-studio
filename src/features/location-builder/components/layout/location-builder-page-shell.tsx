interface LocationBuilderPageShellProps {
    children: React.ReactNode;
}

export default function LocationBuilderPageShell({
    children,
}: LocationBuilderPageShellProps) {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 py-8">
            <header className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Location hierarchy
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Define and order the location levels your Program&apos;s
                    sites are organized into.
                </p>
            </header>
            {children}
        </div>
    );
}
