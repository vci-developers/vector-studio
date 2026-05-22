import DraftEditorPageClient from "@/features/form-builder/components/draft-editor-page-client";
import DraftEditorShell from "@/features/form-builder/components/layout/draft-editor-shell";

export default function DraftFormPage() {
    return (
        <DraftEditorShell>
            <DraftEditorPageClient />
        </DraftEditorShell>
    );
}
