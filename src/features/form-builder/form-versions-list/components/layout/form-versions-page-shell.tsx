interface FormVersionsPageShellProps {
    children: React.ReactNode;
}

export default function FormVersionsPageShell({
    children,
}: FormVersionsPageShellProps) {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 py-8">
            <header className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Surveillance forms
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Manage the question list your field workers see in the
                    surveillance app.
                </p>
            </header>
            {children}
        </div>
    );
}
