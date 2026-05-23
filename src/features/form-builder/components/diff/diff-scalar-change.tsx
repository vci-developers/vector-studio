interface DiffScalarChangeProps {
    fromText: string;
    toText: string;
}

export default function DiffScalarChange({
    fromText,
    toText,
}: DiffScalarChangeProps) {
    return (
        <span className="inline-flex flex-wrap items-baseline gap-1.5">
            <span className="text-destructive line-through">{fromText}</span>
            <span className="text-muted-foreground" aria-hidden="true">
                →
            </span>
            <span className="text-success">{toText}</span>
        </span>
    );
}
