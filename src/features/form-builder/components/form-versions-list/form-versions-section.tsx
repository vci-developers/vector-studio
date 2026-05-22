interface FormVersionsSectionProps {
    label: string;
    children: React.ReactNode;
}

export default function FormVersionsSection({
    label,
    children,
}: FormVersionsSectionProps) {
    return (
        <section className="space-y-2.5">
            <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                {label}
            </h2>
            {children}
        </section>
    );
}
