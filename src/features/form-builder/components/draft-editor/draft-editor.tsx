'use client';

import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import { useGetDraftFormByProgramId } from '@/api/form/hooks/use-get-draft-form-by-program-id';
import { useState } from 'react';
import DraftEditorSkeleton from '../loading/draft-editor-skeleton';
import FormErrorBanner from '../error/form-error-banner';
import DeleteQuestionDialog from './delete-question-dialog';
import QuestionSheet from './question-sheet';
import DraftEditorHeader from './draft-editor-header';
import QuestionList from './question-list';
import PublishDialog from './publish-dialog';

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
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);

    if (!getDraftFormByProgramIdResult || isGetDraftFormByProgramIdPending) {
        return <DraftEditorSkeleton />;
    }

    if (!getDraftFormByProgramIdResult.ok) {
        return (
            <FormErrorBanner
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
                onOpenPublishDialog={() => setIsPublishDialogOpen(true)}
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
            <QuestionSheet
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
            <PublishDialog
                isOpen={isPublishDialogOpen}
                programId={programId}
                onClose={() => setIsPublishDialogOpen(false)}
            />
        </div>
    );
}
