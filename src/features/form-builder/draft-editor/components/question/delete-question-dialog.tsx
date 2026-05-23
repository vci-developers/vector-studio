'use client';

import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import { useDeleteQuestionFromDraftForm } from '@/api/form-question/hooks/use-delete-question-from-draft-form';
import type { Form } from '@/api/form/contracts/form-schema';
import { findDependentQuestions } from '../../utils/question-dependencies';
import { toast } from 'sonner';
import { networkErrorMessage } from '@/lib/network/network-error';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DeleteQuestionDialogProps {
    questionPendingDeletion: FormQuestion | null;
    programId: number;
    draft: Form;
    onClose: () => void;
}

export default function DeleteQuestionDialog({
    questionPendingDeletion,
    programId,
    draft,
    onClose,
}: DeleteQuestionDialogProps) {
    const {
        mutate: removeQuestionFromDraftForm,
        isPending: isRemoveQuestionFromDraftFormPending,
    } = useDeleteQuestionFromDraftForm();

    const dependentQuestions = questionPendingDeletion
        ? findDependentQuestions(questionPendingDeletion.id, draft)
        : [];
    const hasDependents = dependentQuestions.length > 0;
    const hasSubQuestions =
        (questionPendingDeletion?.subQuestions?.length ?? 0) > 0;

    function confirmDelete() {
        if (!questionPendingDeletion) return;
        removeQuestionFromDraftForm(
            { programId, questionId: questionPendingDeletion.id },
            {
                onSuccess: result => {
                    if (!result.ok) {
                        toast.error("Couldn't delete the question", {
                            description: networkErrorMessage(result.error),
                        });
                        return;
                    }
                    toast.success('Question deleted');
                    onClose();
                },
                onError: () => {
                    toast.error("Couldn't delete the question", {
                        description:
                            'A network error occurred. Please try again.',
                    });
                },
            },
        );
    }

    return (
        <Dialog
            open={questionPendingDeletion !== null}
            onOpenChange={open => {
                if (!open) onClose();
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {hasDependents
                            ? "Can't delete this question yet"
                            : 'Delete this question?'}
                    </DialogTitle>
                    <DialogDescription>
                        {hasDependents ? (
                            <Fragment>
                                Other questions use{' '}
                                <span className="text-foreground font-medium">
                                    &ldquo;{questionPendingDeletion?.label}
                                    &rdquo;
                                </span>{' '}
                                in their visibility rules. Remove or update
                                those rules first.
                            </Fragment>
                        ) : (
                            <Fragment>
                                This will permanently remove{' '}
                                <span className="text-foreground font-medium">
                                    &ldquo;{questionPendingDeletion?.label}
                                    &rdquo;
                                </span>{' '}
                                from the draft.
                                {hasSubQuestions &&
                                    ' Its follow-up questions will be deleted too.'}
                            </Fragment>
                        )}
                    </DialogDescription>
                </DialogHeader>
                {hasDependents && (
                    <div className="border-border bg-muted/30 rounded-md border p-3 text-sm">
                        <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                            Used by
                        </div>
                        <ul className="space-y-1.5">
                            {dependentQuestions.map(dependentQuestion => (
                                <li
                                    key={dependentQuestion.id}
                                    className="text-foreground"
                                >
                                    {dependentQuestion.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isRemoveQuestionFromDraftFormPending}
                    >
                        {hasDependents ? 'Close' : 'Cancel'}
                    </Button>
                    {!hasDependents && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isRemoveQuestionFromDraftFormPending}
                        >
                            {isRemoveQuestionFromDraftFormPending && (
                                <Loader2 className="animate-spin" />
                            )}
                            Delete question
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
