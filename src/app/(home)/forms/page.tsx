import FormVersionsPageClient from '@/features/form-builder/form-versions-list/components/form-versions-page-client';
import FormVersionsPageShell from '@/features/form-builder/form-versions-list/components/layout/form-versions-page-shell';

export default function FormsPage() {
    return (
        <FormVersionsPageShell>
            <FormVersionsPageClient />
        </FormVersionsPageShell>
    );
}
