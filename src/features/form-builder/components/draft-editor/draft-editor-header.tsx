import type { Form } from '@/api/form/contracts/form-schema';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import FormNameInlineEdit from './form-name-inline-edit';
import { Button } from '@/components/ui/button';

interface DraftEditorHeaderProps {
    programId: number;
    draft: Form;
    onOpenPublishDialog: () => void;
}

export default function DraftEditorHeader({
    programId,
    draft,
    onOpenPublishDialog,
}: DraftEditorHeaderProps) {
    return (
        <Card className="gap-0 p-0">
            <div className="space-y-2 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
                        <Badge
                            variant="outline"
                            className="text-muted-foreground"
                        >
                            Draft
                        </Badge>
                        <span aria-hidden="true">·</span>
                        <span>Unpublished</span>
                    </div>
                    <Button type="button" onClick={onOpenPublishDialog}>
                        Publish
                    </Button>
                </div>
                <FormNameInlineEdit programId={programId} draft={draft} />
            </div>
        </Card>
    );
}
