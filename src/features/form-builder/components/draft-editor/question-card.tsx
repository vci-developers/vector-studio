'use client';

import type {
    FormQuestion,
    FormQuestionType,
} from '@/api/form-question/contracts/form-question-schema';
import { usePutQuestionToDraftForm } from '@/api/form-question/hooks/use-put-question-to-draft-form';
import type { Form } from '@/api/form/contracts/form-schema';
import { Fragment, useState } from 'react';
import { swapAdjacentSiblings } from '../../utils/form-question-order';
import { toast } from 'sonner';
import { networkErrorMessage } from '@/lib/network/network-error';
import { describePrerequisite } from '../../utils/form-question-prerequisite';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
    ArrowDown,
    ArrowUp,
    CornerDownRight,
    MoreHorizontal,
    Pencil,
    Trash2,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const QUESTION_TYPE_LABELS: Record<FormQuestionType, string> = {
    text: 'Short text',
    number: 'Number',
    boolean: 'Yes / No',
    select: 'Dropdown',
    date: 'Date',
};

interface QuestionCardProps {
    question: FormQuestion;
    siblings: FormQuestion[];
    siblingIndex: number;
    draft: Form;
    onAddQuestion: (parentId: number | null) => void;
    onEditQuestion: (question: FormQuestion) => void;
    onDeleteQuestion: (question: FormQuestion) => void;
}

export default function QuestionCard({
    question,
    siblings,
    siblingIndex,
    draft,
    onAddQuestion,
    onEditQuestion,
    onDeleteQuestion,
}: QuestionCardProps) {
    const { mutateAsync: updateQuestionInDraftForm } =
        usePutQuestionToDraftForm();
    const [isReordering, setIsReordering] = useState(false);

    const canMoveUp = siblingIndex > 0;
    const canMoveDown = siblingIndex < siblings.length - 1;

    async function move(direction: 'up' | 'down') {
        const swapPair = swapAdjacentSiblings(question.id, direction, draft);
        if (!swapPair) return;
        const [first, second] = swapPair;
        if (!first || !second) return;

        setIsReordering(true);
        try {
            const firstResult = await updateQuestionInDraftForm({
                programId: draft.programId,
                questionId: first.id,
                requestBody: { order: first.order },
            });
            if (!firstResult.ok) {
                toast.error("Couldn't reorder question", {
                    description: networkErrorMessage(firstResult.error),
                });
                return;
            }
            const secondResult = await updateQuestionInDraftForm({
                programId: draft.programId,
                questionId: second.id,
                requestBody: { order: second.order },
            });
            if (!secondResult.ok) {
                toast.error('Reorder finished partway', {
                    description:
                        "We've refreshed the draft so you can see the current state and try again.",
                });
            }
        } catch {
            toast.error("Couldn't reorder question", {
                description: 'A network error occurred. Please try again.',
            });
        } finally {
            setIsReordering(false);
        }
    }

    const prerequisitePreview = describePrerequisite(
        question.prerequisite,
        draft,
    );

    const subQuestions = (question.subQuestions ?? [])
        .slice()
        .sort((a, b) => a.order - b.order);

    return (
        <div>
            <div className="flex items-start gap-3 px-4 py-3.5">
                <div className="flex flex-col gap-0.5 pt-0.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => move('up')}
                                disabled={!canMoveUp || isReordering}
                                aria-label="Move question up"
                            >
                                <ArrowUp />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Move up</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => move('down')}
                                disabled={!canMoveDown || isReordering}
                                aria-label="Move question down"
                            >
                                <ArrowDown />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Move down</TooltipContent>
                    </Tooltip>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onEditQuestion(question)}
                    className="group hover:bg-muted/40 dark:hover:bg-muted/40 h-auto min-w-0 flex-1 flex-col items-start justify-start gap-1 px-1.5 py-1 text-left font-normal whitespace-normal"
                >
                    <span className="text-sm font-medium group-hover:underline">
                        {question.label}
                    </span>
                    <span className="text-muted-foreground flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span>{QUESTION_TYPE_LABELS[question.type]}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                            {question.required ? 'Required' : 'Optional'}
                        </span>
                        {prerequisitePreview && (
                            <Fragment>
                                <span aria-hidden="true">·</span>
                                <span className="truncate">
                                    Shown when {prerequisitePreview}
                                </span>
                            </Fragment>
                        )}
                    </span>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Question actions"
                        >
                            <MoreHorizontal />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                            onSelect={() => onEditQuestion(question)}
                        >
                            <Pencil />
                            Edit question
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => onAddQuestion(question.id)}
                        >
                            <CornerDownRight />
                            Add follow-up
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => onDeleteQuestion(question)}
                        >
                            <Trash2 />
                            Delete question
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {subQuestions.length > 0 && (
                <div className="border-border/60 divide-border/60 ml-8 divide-y border-l">
                    {subQuestions.map((subQuestion, index) => (
                        <QuestionCard
                            key={subQuestion.id}
                            question={subQuestion}
                            siblings={subQuestions}
                            siblingIndex={index}
                            draft={draft}
                            onAddQuestion={onAddQuestion}
                            onEditQuestion={onEditQuestion}
                            onDeleteQuestion={onDeleteQuestion}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
