interface FormsPageShellProps {
    children: React.ReactNode;
}

export default function FormsPageShell({ children }: FormsPageShellProps) {
    return (
        <div className="mx-auto w-full max-w-3xl space-y-8">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Surveillance forms
                </h1>
                <p className="text-muted-foreground text-sm">
                    Manage the question list your field workers see in the
                    surveillance app.
                </p>
            </header>
            {children}
        </div>
    );
}
