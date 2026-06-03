'use client';

import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type {
    PrerequisiteOperator,
    PrerequisitePredicate,
} from '@/api/form-question/contracts/prerequisite-expression-schema';
import {
    getDefaultPredicateValue,
    getOperatorsAlreadyUsedOnQuestion,
    PREREQUISITE_OPERATOR_LABELS,
    PREREQUISITE_OPERATORS_BY_QUESTION_TYPE,
} from '@/features/form-builder/utils/prerequisite';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import PrerequisiteValueInput from './prerequisite-value-input';

interface PrerequisitePredicateRowProps {
    predicate: PrerequisitePredicate;
    otherSiblingPredicates: PrerequisitePredicate[];
    referencableQuestions: FormQuestion[];
    onPredicateChange: (nextPredicate: PrerequisitePredicate) => void;
    onRemovePredicate: () => void;
}

export default function PrerequisitePredicateRow({
    predicate,
    otherSiblingPredicates,
    referencableQuestions,
    onPredicateChange,
    onRemovePredicate,
}: PrerequisitePredicateRowProps) {
    const referencedQuestion = referencableQuestions.find(
        candidate => candidate.id === predicate.questionId,
    );

    const conflictingOperatorsOnCurrentQuestion = referencedQuestion
        ? getOperatorsAlreadyUsedOnQuestion(
              otherSiblingPredicates,
              referencedQuestion.id,
          )
        : [];

    const availableOperators = referencedQuestion
        ? PREREQUISITE_OPERATORS_BY_QUESTION_TYPE[
              referencedQuestion.type
          ].filter(
              operator =>
                  !conflictingOperatorsOnCurrentQuestion.includes(operator),
          )
        : [];

    const selectableQuestions = referencableQuestions.filter(
        candidateQuestion => {
            const operatorsAlreadyUsedOnCandidate =
                getOperatorsAlreadyUsedOnQuestion(
                    otherSiblingPredicates,
                    candidateQuestion.id,
                );
            return PREREQUISITE_OPERATORS_BY_QUESTION_TYPE[
                candidateQuestion.type
            ].some(
                operator => !operatorsAlreadyUsedOnCandidate.includes(operator),
            );
        },
    );

    function revisePredicate(
        revisedPartialPredicate: Partial<PrerequisitePredicate>,
    ) {
        const nextOperator =
            revisedPartialPredicate.operator ?? predicate.operator;
        const nextQuestionId =
            revisedPartialPredicate.questionId ?? predicate.questionId;
        const nextQuestion = referencableQuestions.find(
            candidateQuestion => candidateQuestion.id === nextQuestionId,
        );
        if (!nextQuestion) return;
        const nextValue =
            'value' in revisedPartialPredicate
                ? revisedPartialPredicate.value
                : getDefaultPredicateValue(nextQuestion, nextOperator);
        onPredicateChange({
            questionId: nextQuestionId,
            operator: nextOperator,
            value: nextValue,
        });
    }

    function changeReferencedQuestion(nextReferencedQuestionId: number) {
        const nextReferencedQuestion = referencableQuestions.find(
            candidate => candidate.id === nextReferencedQuestionId,
        );
        if (!nextReferencedQuestion) return;
        const operatorsAlreadyUsedOnNextQuestion =
            getOperatorsAlreadyUsedOnQuestion(
                otherSiblingPredicates,
                nextReferencedQuestion.id,
            );
        const firstAvailableOperator = PREREQUISITE_OPERATORS_BY_QUESTION_TYPE[
            nextReferencedQuestion.type
        ].find(
            operator => !operatorsAlreadyUsedOnNextQuestion.includes(operator),
        );
        if (!firstAvailableOperator) return;
        revisePredicate({
            questionId: nextReferencedQuestion.id,
            operator: firstAvailableOperator,
        });
    }

    return (
        <div className="border-border bg-background flex flex-wrap items-start gap-2 rounded-md border p-2">
            <Select
                value={String(predicate.questionId)}
                onValueChange={nextReferencedQuestionId =>
                    changeReferencedQuestion(Number(nextReferencedQuestionId))
                }
            >
                <SelectTrigger size="sm" className="max-w-full min-w-44 flex-1">
                    <SelectValue placeholder="Pick a question" />
                </SelectTrigger>
                <SelectContent>
                    {selectableQuestions.map(question => (
                        <SelectItem
                            key={question.id}
                            value={String(question.id)}
                        >
                            {question.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={predicate.operator}
                onValueChange={nextOperator =>
                    revisePredicate({
                        operator: nextOperator as PrerequisiteOperator,
                    })
                }
                disabled={!referencedQuestion}
            >
                <SelectTrigger size="sm" className="min-w-36">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {availableOperators.map(operatorOption => (
                        <SelectItem key={operatorOption} value={operatorOption}>
                            {PREREQUISITE_OPERATOR_LABELS[operatorOption]}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {referencedQuestion && (
                <PrerequisiteValueInput
                    referencedQuestion={referencedQuestion}
                    operator={predicate.operator}
                    predicateValue={predicate.value}
                    onPredicateValueChange={nextPredicateValue =>
                        revisePredicate({ value: nextPredicateValue })
                    }
                />
            )}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={onRemovePredicate}
                        aria-label="Remove condition"
                        className="text-muted-foreground hover:text-destructive ml-auto"
                    >
                        <X />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Remove condition</TooltipContent>
            </Tooltip>
        </div>
    );
}
