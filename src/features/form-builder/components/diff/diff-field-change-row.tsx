interface DiffFieldChangeRowProps {
    label: string;
    children: React.ReactNode;
}

export default function DiffFieldChangeRow({
    label,
    children,
}: DiffFieldChangeRowProps) {
    return (
        <div className="flex items-baseline gap-3 text-xs">
            <span className="text-muted-foreground w-24 shrink-0 font-medium">
                {label}
            </span>
            <span className="flex-1">{children}</span>
        </div>
    );
}