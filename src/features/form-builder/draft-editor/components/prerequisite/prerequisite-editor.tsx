'use client';

import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type {
    PrerequisiteExpression,
    PrerequisitePredicate,
} from '@/api/form-question/contracts/prerequisite-expression-schema';
import type { Form } from '@/api/form/contracts/form-schema';
import {
    buildPrerequisite,
    describePrerequisite,
    getDefaultValueForPredicate,
    getOperatorsUsedOnQuestion,
    getPrerequisiteConnector,
    getPrerequisitePredicates,
    isPrerequisiteEditable,
    OPERATORS_BY_QUESTION_TYPE,
} from '../../../utils/prerequisite';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import PrerequisitePredicateRow from './prerequisite-predicate-row';
import PrerequisiteComplexRuleSummary from './prerequisite-complex-rule-summary';
import { walkQuestions } from '@/features/form-builder/utils/walk-questions';

interface PrerequisiteEditorProps {
    draft: Form;
    questionBeingEdited: FormQuestion | null;
    prerequisiteExpression: PrerequisiteExpression | null;
    onPrerequisiteExpressionChange: (
        nextExpression: PrerequisiteExpression | null,
    ) => void;
}

export default function PrerequisiteEditor({
    draft,
    questionBeingEdited,
    prerequisiteExpression,
    onPrerequisiteExpressionChange,
}: PrerequisiteEditorProps) {
    if (
        prerequisiteExpression &&
        !isPrerequisiteEditable(prerequisiteExpression)
    ) {
        return (
            <PrerequisiteComplexRuleSummary
                prerequisiteExpression={prerequisiteExpression}
                draft={draft}
            />
        );
    }

    const connector = getPrerequisiteConnector(prerequisiteExpression);
    const predicates = getPrerequisitePredicates(prerequisiteExpression);

    const excludedQuestionId = questionBeingEdited?.id ?? null;
    const referencableQuestions: FormQuestion[] = [];
    walkQuestions(draft.questions, question => {
        if (question.id !== excludedQuestionId) {
            referencableQuestions.push(question);
        }
    });
    const hasReferencableQuestions = referencableQuestions.length > 0;

    function findFirstAvailablePredicate() {
        for (const candidateQuestion of referencableQuestions) {
            const usedOperatorsOnCandidate = getOperatorsUsedOnQuestion(
                predicates,
                candidateQuestion.id,
                null,
            );
            const firstAvailableOperator = OPERATORS_BY_QUESTION_TYPE[
                candidateQuestion.type
            ].find(operator => !usedOperatorsOnCandidate.includes(operator));
            if (firstAvailableOperator) {
                return {
                    question: candidateQuestion,
                    operator: firstAvailableOperator,
                };
            }
        }
        return null;
    }

    const canAddMorePredicates = findFirstAvailablePredicate() !== null;

    function addPredicate() {
        const availablePredicate = findFirstAvailablePredicate();
        if (!availablePredicate) return;
        const newPredicate: PrerequisitePredicate = {
            questionId: availablePredicate.question.id,
            operator: availablePredicate.operator,
            value: getDefaultValueForPredicate(
                availablePredicate.question,
                availablePredicate.operator,
            ),
        };
        onPrerequisiteExpressionChange(
            buildPrerequisite(connector, [...predicates, newPredicate]),
        );
    }

    function updatePredicateAt(
        predicateIndex: number,
        nextPredicate: PrerequisitePredicate,
    ) {
        const nextPredicates = predicates.slice();
        nextPredicates[predicateIndex] = nextPredicate;
        onPrerequisiteExpressionChange(
            buildPrerequisite(connector, nextPredicates),
        );
    }

    function removePredicateAt(predicateIndex: number) {
        onPrerequisiteExpressionChange(
            buildPrerequisite(
                connector,
                predicates.filter((_, index) => index !== predicateIndex),
            ),
        );
    }

    if (predicates.length === 0) {
        return (
            <div className="border-border bg-muted/30 space-y-3 rounded-md border p-3">
                <p className="text-muted-foreground text-sm">
                    {hasReferencableQuestions
                        ? 'No visibility rule. This question is always shown.'
                        : 'Add at least one other question first to use it in a visibility rule.'}
                </p>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPredicate}
                    disabled={!canAddMorePredicates}
                >
                    <Plus />
                    Add condition
                </Button>
            </div>
        );
    }

    const previewSentence = describePrerequisite(prerequisiteExpression, draft);

    return (
        <div className="border-border bg-muted/30 space-y-3 rounded-md border p-3">
            {predicates.length >= 2 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                        Show when
                    </span>
                    <Select
                        value={connector}
                        onValueChange={nextConnector =>
                            onPrerequisiteExpressionChange(
                                buildPrerequisite(
                                    nextConnector as 'all' | 'any',
                                    predicates,
                                ),
                            )
                        }
                    >
                        <SelectTrigger size="sm" className="min-w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                all conditions match
                            </SelectItem>
                            <SelectItem value="any">
                                any condition matches
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
            <ul className="space-y-2">
                {predicates.map((predicate, predicateIndex) => (
                    <li key={predicateIndex}>
                        <PrerequisitePredicateRow
                            predicate={predicate}
                            predicateIndex={predicateIndex}
                            allPredicates={predicates}
                            referencableQuestions={referencableQuestions}
                            onPredicateChange={nextPredicate =>
                                updatePredicateAt(predicateIndex, nextPredicate)
                            }
                            onRemovePredicate={() =>
                                removePredicateAt(predicateIndex)
                            }
                        />
                    </li>
                ))}
            </ul>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPredicate}
                disabled={!canAddMorePredicates}
            >
                <Plus />
                Add condition
            </Button>
            {previewSentence && (
                <p className="text-muted-foreground border-border/60 border-t pt-3 text-sm">
                    <span className="text-foreground font-medium">
                        Preview:
                    </span>{' '}
                    Shown when {previewSentence}
                </p>
            )}
        </div>
    );
}
