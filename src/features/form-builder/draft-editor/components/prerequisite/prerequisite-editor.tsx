'use client';

import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type { PrerequisiteExpression } from '@/api/form-question/contracts/prerequisite-expression-schema';
import type { Form } from '@/api/form/contracts/form-schema';
import {
    buildPrerequisiteGroup,
    describePrerequisite,
    findFirstAvailablePredicate,
} from '@/features/form-builder/utils/prerequisite';
import { walkQuestions } from '@/features/form-builder/utils/walk-questions';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import PrerequisiteNodeEditor from './prerequisite-node-editor';

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
    const excludedQuestionId = questionBeingEdited?.id ?? null;
    const referencableQuestions: FormQuestion[] = [];
    walkQuestions(draft.questions, question => {
        if (question.id !== excludedQuestionId) {
            referencableQuestions.push(question);
        }
    });
    const hasReferencableQuestions = referencableQuestions.length > 0;

    if (!prerequisiteExpression) {
        const addFirstCondition = () => {
            const firstPredicate = findFirstAvailablePredicate(
                referencableQuestions,
                [],
            );
            if (!firstPredicate) return;
            onPrerequisiteExpressionChange(firstPredicate);
        };
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
                    onClick={addFirstCondition}
                    disabled={!hasReferencableQuestions}
                >
                    <Plus />
                    Add condition
                </Button>
            </div>
        );
    }

    const previewSentence = describePrerequisite(prerequisiteExpression, draft);

    if ('questionId' in prerequisiteExpression) {
        const currentRootPredicate = prerequisiteExpression;

        const addSiblingPredicate = () => {
            const newSiblingPredicate = findFirstAvailablePredicate(
                referencableQuestions,
                [currentRootPredicate],
            );
            if (!newSiblingPredicate) return;
            onPrerequisiteExpressionChange(
                buildPrerequisiteGroup('all', [
                    currentRootPredicate,
                    newSiblingPredicate,
                ]),
            );
        };

        const addSiblingSubGroup = () => {
            const firstPredicateInNewSubGroup = findFirstAvailablePredicate(
                referencableQuestions,
                [],
            );
            if (!firstPredicateInNewSubGroup) return;
            const newSubGroup = buildPrerequisiteGroup('all', [
                firstPredicateInNewSubGroup,
            ]);
            if (!newSubGroup) return;
            onPrerequisiteExpressionChange(
                buildPrerequisiteGroup('all', [
                    currentRootPredicate,
                    newSubGroup,
                ]),
            );
        };

        const canAddSiblingPredicate =
            findFirstAvailablePredicate(referencableQuestions, [
                currentRootPredicate,
            ]) !== null;

        return (
            <div className="space-y-3">
                <div className="border-border bg-muted/30 space-y-3 rounded-md border p-3">
                    <PrerequisiteNodeEditor
                        nodeExpression={currentRootPredicate}
                        referencableQuestions={referencableQuestions}
                        otherSiblingPredicates={[]}
                        onNodeExpressionChange={onPrerequisiteExpressionChange}
                        onRemoveNode={() =>
                            onPrerequisiteExpressionChange(null)
                        }
                        canRemoveNode={false}
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addSiblingPredicate}
                            disabled={!canAddSiblingPredicate}
                        >
                            <Plus />
                            Add condition
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addSiblingSubGroup}
                            disabled={!hasReferencableQuestions}
                        >
                            <Plus />
                            Add group
                        </Button>
                    </div>
                </div>
                {previewSentence && (
                    <p className="text-muted-foreground text-sm">
                        <span className="text-foreground font-medium">
                            Preview:
                        </span>{' '}
                        Shown when {previewSentence}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <PrerequisiteNodeEditor
                nodeExpression={prerequisiteExpression}
                referencableQuestions={referencableQuestions}
                otherSiblingPredicates={[]}
                onNodeExpressionChange={onPrerequisiteExpressionChange}
                onRemoveNode={() => onPrerequisiteExpressionChange(null)}
                canRemoveNode={false}
            />
            {previewSentence && (
                <p className="text-muted-foreground text-sm">
                    <span className="text-foreground font-medium">
                        Preview:
                    </span>{' '}
                    Shown when {previewSentence}
                </p>
            )}
        </div>
    );
}
