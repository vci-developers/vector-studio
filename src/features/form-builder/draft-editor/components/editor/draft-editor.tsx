'use client';

import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import { useGetDraftFormByProgramId } from '@/api/form/hooks/use-get-draft-form-by-program-id';
import { useState } from 'react';
import DraftEditorSkeleton from '../loading/draft-editor-skeleton';
import FormBuilderErrorBanner from '../../../components/error/form-builder-error-banner';
import DeleteQuestionDialog from '../question/delete-question-dialog';
import QuestionFormSheet from '../question/question-form-sheet';
import DraftEditorHeader from './draft-editor-header';
import QuestionList from '../question/question-list';
import PublishSheet from '../publish/publish-sheet';

interface DraftEditorProps {
    programId: number;
}

export default function DraftEditor({ programId }: DraftEditorProps) {
    const {
        data: getDraftFormByProgramIdResult,
        isPending: isGetDraftFormByProgramIdPending,
        refetch: refetchDraftFormByProgramId,
    } = useGetDraftFormByProgramId(programId);

    const [questionBeingEdited, setQuestionBeingEdited] =
        useState<FormQuestion | null>(null);
    const [isAddQuestionSheetOpen, setIsAddQuestionSheetOpen] = useState(false);
    const [parentIdForNewQuestion, setParentIdForNewQuestion] = useState<
        number | null
    >(null);
    const [questionPendingDeletion, setQuestionPendingDeletion] =
        useState<FormQuestion | null>(null);
    const [isPublishSheetOpen, setIsPublishSheetOpen] = useState(false);

    if (!getDraftFormByProgramIdResult || isGetDraftFormByProgramIdPending) {
        return <DraftEditorSkeleton />;
    }

    if (!getDraftFormByProgramIdResult.ok) {
        return (
            <FormBuilderErrorBanner
                title="Couldn't load the draft form"
                error={getDraftFormByProgramIdResult.error}
                onRetry={() => {
                    void refetchDraftFormByProgramId();
                }}
            />
        );
    }

    const draft = getDraftFormByProgramIdResult.data;

    return (
        <div className="space-y-8">
            <DraftEditorHeader
                programId={programId}
                draft={draft}
                onOpenPublishSheet={() => setIsPublishSheetOpen(true)}
            />
            <QuestionList
                draft={draft}
                onAddQuestion={parentId => {
                    setParentIdForNewQuestion(parentId);
                    setIsAddQuestionSheetOpen(true);
                }}
                onEditQuestion={setQuestionBeingEdited}
                onDeleteQuestion={setQuestionPendingDeletion}
            />
            <QuestionFormSheet
                questionBeingEdited={questionBeingEdited}
                isAddQuestionSheetOpen={isAddQuestionSheetOpen}
                parentIdForNewQuestion={parentIdForNewQuestion}
                programId={programId}
                draft={draft}
                onClose={() => {
                    setQuestionBeingEdited(null);
                    setIsAddQuestionSheetOpen(false);
                }}
            />
            <DeleteQuestionDialog
                questionPendingDeletion={questionPendingDeletion}
                programId={programId}
                draft={draft}
                onClose={() => setQuestionPendingDeletion(null)}
            />
            <PublishSheet
                isOpen={isPublishSheetOpen}
                programId={programId}
                draftForm={draft}
                onClose={() => setIsPublishSheetOpen(false)}
            />
        </div>
    );
}
