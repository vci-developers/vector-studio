interface VersionsSectionProps {
    label: string;
    children: React.ReactNode;
}

export default function VersionsSection({
    label,
    children,
}: VersionsSectionProps) {
    return (
        <section className="space-y-2.5">
            <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                {label}
            </h2>
            {children}
        </section>
    );
}
