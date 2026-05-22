import type { Form } from "@/api/form/contracts/form-schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import FormNameInlineEdit from "./form-name-inline-edit";

interface DraftEditorHeaderProps {
    programId: number;
    draft: Form;
}

export default function DraftEditorHeader({
    programId,
    draft,
}: DraftEditorHeaderProps) {
    return (
        <Card className="gap-0 p-0">
            <div className="space-y-2 px-5 py-4">
                <div className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
                    <Badge variant="outline" className="text-muted-foreground">
                        Draft
                    </Badge>
                    <span aria-hidden="true">·</span>
                    <span>Unpublished</span>
                </div>
                <FormNameInlineEdit programId={programId} draft={draft} />
            </div>
        </Card>
    );
}