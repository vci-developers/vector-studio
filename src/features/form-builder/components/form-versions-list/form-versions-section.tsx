interface FormVersionsSectionProps {
    label: string;
    children: React.ReactNode;
}

export default function FormVersionsSection({
    label,
    children,
}: FormVersionsSectionProps) {
    return (
        <section className="space-y-3">
            <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {label}
            </h2>
            {children}
        </section>
    );
}
