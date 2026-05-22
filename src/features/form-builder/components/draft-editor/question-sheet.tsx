'use client';

import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type { Form } from '@/api/form/contracts/form-schema';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import QuestionForm from './question-form';

interface QuestionSheetProps {
    questionBeingEdited: FormQuestion | null;
    isAddQuestionSheetOpen: boolean;
    parentIdForNewQuestion: number | null;
    programId: number;
    draft: Form;
    onClose: () => void;
}

export default function QuestionSheet({
    questionBeingEdited,
    isAddQuestionSheetOpen,
    parentIdForNewQuestion,
    programId,
    draft,
    onClose,
}: QuestionSheetProps) {
    const isOpen = questionBeingEdited !== null || isAddQuestionSheetOpen;

    return (
        <Sheet
            open={isOpen}
            onOpenChange={open => {
                if (!open) onClose();
            }}
        >
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="border-b px-6 py-4">
                    <SheetTitle className="text-base">
                        {questionBeingEdited
                            ? 'Edit question'
                            : parentIdForNewQuestion !== null
                              ? 'Add follow-up question'
                              : 'Add question'}
                    </SheetTitle>
                    <SheetDescription>
                        {questionBeingEdited
                            ? 'Update the label, type, requiredness, or options. Changes save when you click Save.'
                            : 'Define the question your field workers will see. You can add follow-ups and visibility rules afterwards.'}
                    </SheetDescription>
                </SheetHeader>
                {isOpen && (
                    <QuestionForm
                        key={
                            questionBeingEdited
                                ? `edit-${questionBeingEdited.id}`
                                : `add-${parentIdForNewQuestion ?? 'root'}`
                        }
                        programId={programId}
                        draft={draft}
                        questionBeingEdited={questionBeingEdited}
                        parentIdForNewQuestion={parentIdForNewQuestion}
                        onClose={onClose}
                    />
                )}
            </SheetContent>
        </Sheet>
    );
}
