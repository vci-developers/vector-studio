'use client';

import { useGetDraftFormByProgramId } from '@/api/form/hooks/use-get-draft-form-by-program-id';
import { useGetProgramFormByVersion } from '@/api/form/hooks/use-get-program-form-by-version';
import { useMemo, useState } from 'react';
import { diffFormVersions } from '../../../utils/form-version-diff';
import HistoricalViewerSkeleton from '../loading/historical-viewer-skeleton';
import FormBuilderErrorBanner from '../../../components/error/form-builder-error-banner';
import DiffSummary from '../../../components/diff/diff-summary';
import DiffQuestionList from '../../../components/diff/diff-question-list';
import CheckoutConfirmDialog from '../checkout/checkout-confirm-dialog';
import HistoricalViewerHeader from './historical-viewer-header';
import type { Form } from '@/api/form/contracts/form-schema';

interface HistoricalViewerProps {
    programId: number;
    version: string;
}

export default function HistoricalViewer({
    programId,
    version,
}: HistoricalViewerProps) {
    const {
        data: getViewedFormResult,
        isPending: isGetViewedFormPending,
        refetch: refetchViewedForm,
    } = useGetProgramFormByVersion(programId, version);
    const {
        data: getDraftFormResult,
        isPending: isGetDraftFormPending,
        refetch: refetchDraftForm,
    } = useGetDraftFormByProgramId(programId);

    const [formToCheckout, setFormToCheckout] = useState<Form | null>(null);

    const formVersionDiff = useMemo(() => {
        if (!getViewedFormResult?.ok || !getDraftFormResult?.ok) return null;
        return diffFormVersions(
            getDraftFormResult.data,
            getViewedFormResult.data,
        );
    }, [getViewedFormResult, getDraftFormResult]);

    if (
        !getViewedFormResult ||
        isGetViewedFormPending ||
        !getDraftFormResult ||
        isGetDraftFormPending
    ) {
        return <HistoricalViewerSkeleton />;
    }

    if (!getViewedFormResult.ok) {
        return (
            <FormBuilderErrorBanner
                title={`Couldn't load version ${version}`}
                error={getViewedFormResult.error}
                onRetry={() => {
                    void refetchViewedForm();
                }}
            />
        );
    }

    if (!getDraftFormResult.ok) {
        return (
            <FormBuilderErrorBanner
                title="Couldn't load the draft to compare against"
                error={getDraftFormResult.error}
                onRetry={() => {
                    void refetchDraftForm();
                }}
            />
        );
    }

    const viewedForm = getViewedFormResult.data;
    const draftForm = getDraftFormResult.data;

    return (
        <div className="space-y-8">
            <HistoricalViewerHeader
                viewedForm={viewedForm}
                onRequestCheckout={() => setFormToCheckout(viewedForm)}
            />
            {formVersionDiff && (
                <DiffSummary summary={formVersionDiff.summary} />
            )}
            {formVersionDiff && (
                <DiffQuestionList
                    questionDiffs={formVersionDiff.questionDiffs}
                    fromForm={draftForm}
                    toForm={viewedForm}
                    fromColumnLabel="Your draft"
                    toColumnLabel={`Version ${viewedForm.version}`}
                />
            )}
            <CheckoutConfirmDialog
                formToCheckout={formToCheckout}
                programId={programId}
                onClose={() => setFormToCheckout(null)}
            />
        </div>
    );
}
