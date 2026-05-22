import FormsPageClient from '@/features/form-builder/components/forms-page-client';
import FormsPageShell from '@/features/form-builder/components/layout/forms-page-shell';

export default function FormsPage() {
    return (
        <FormsPageShell>
            <FormsPageClient />
        </FormsPageShell>
    );
}
