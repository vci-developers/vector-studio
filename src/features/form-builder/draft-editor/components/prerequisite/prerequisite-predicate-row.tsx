'use client';

import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type {
    PrerequisiteOperator,
    PrerequisitePredicate,
    PrerequisiteValue,
} from '@/api/form-question/contracts/prerequisite-expression-schema';
import {
    getDefaultValueForPredicate,
    getOperatorsUsedOnQuestion,
    OPERATOR_LABELS,
    OPERATORS_BY_QUESTION_TYPE,
} from '../../../utils/prerequisite';
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
    predicateIndex: number;
    allPredicates: PrerequisitePredicate[];
    referencableQuestions: FormQuestion[];
    onPredicateChange: (nextPredicate: PrerequisitePredicate) => void;
    onRemovePredicate: () => void;
}

export default function PrerequisitePredicateRow({
    predicate,
    predicateIndex,
    allPredicates,
    referencableQuestions,
    onPredicateChange,
    onRemovePredicate,
}: PrerequisitePredicateRowProps) {
    const referencedQuestion = referencableQuestions.find(
        candidate => candidate.id === predicate.questionId,
    );

    const conflictingOperatorsOnCurrentQuestion = referencedQuestion
        ? getOperatorsUsedOnQuestion(
              allPredicates,
              referencedQuestion.id,
              predicateIndex,
          )
        : [];

    const availableOperators = referencedQuestion
        ? OPERATORS_BY_QUESTION_TYPE[referencedQuestion.type].filter(
              operator =>
                  !conflictingOperatorsOnCurrentQuestion.includes(operator),
          )
        : [];

    const selectableQuestions = referencableQuestions.filter(
        candidateQuestion => {
            const usedOperatorsOnCandidate = getOperatorsUsedOnQuestion(
                allPredicates,
                candidateQuestion.id,
                predicateIndex,
            );
            return OPERATORS_BY_QUESTION_TYPE[candidateQuestion.type].some(
                operator => !usedOperatorsOnCandidate.includes(operator),
            );
        },
    );

    function changeReferencedQuestion(nextReferencedQuestionId: number) {
        const nextReferencedQuestion = referencableQuestions.find(
            candidate => candidate.id === nextReferencedQuestionId,
        );
        if (!nextReferencedQuestion) return;
        const usedOperatorsOnNextQuestion = getOperatorsUsedOnQuestion(
            allPredicates,
            nextReferencedQuestion.id,
            predicateIndex,
        );
        const firstAvailableOperator = OPERATORS_BY_QUESTION_TYPE[
            nextReferencedQuestion.type
        ].find(operator => !usedOperatorsOnNextQuestion.includes(operator));
        if (!firstAvailableOperator) return;
        onPredicateChange({
            questionId: nextReferencedQuestion.id,
            operator: firstAvailableOperator,
            value: getDefaultValueForPredicate(
                nextReferencedQuestion,
                firstAvailableOperator,
            ),
        });
    }

    function changeOperator(nextOperator: PrerequisiteOperator) {
        if (!referencedQuestion) return;
        onPredicateChange({
            questionId: predicate.questionId,
            operator: nextOperator,
            value: getDefaultValueForPredicate(
                referencedQuestion,
                nextOperator,
            ),
        });
    }

    function changePredicateValue(
        nextPredicateValue: PrerequisiteValue | undefined,
    ) {
        onPredicateChange({
            questionId: predicate.questionId,
            operator: predicate.operator,
            value: nextPredicateValue,
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
                    changeOperator(nextOperator as PrerequisiteOperator)
                }
                disabled={!referencedQuestion}
            >
                <SelectTrigger size="sm" className="min-w-36">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {availableOperators.map(operatorOption => (
                        <SelectItem key={operatorOption} value={operatorOption}>
                            {OPERATOR_LABELS[operatorOption]}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {referencedQuestion && (
                <PrerequisiteValueInput
                    referencedQuestion={referencedQuestion}
                    operator={predicate.operator}
                    predicateValue={predicate.value}
                    onPredicateValueChange={changePredicateValue}
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
