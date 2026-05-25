'use client';

import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type {
    PrerequisiteExpression,
    PrerequisitePredicate,
} from '@/api/form-question/contracts/prerequisite-expression-schema';
import {
    buildPrerequisiteGroup,
    getPrerequisiteGroupParts,
    findFirstAvailablePredicate,
    PREREQUISITE_GROUP_CONNECTOR_LABELS,
    type PrerequisiteGroupConnector,
} from '@/features/form-builder/utils/prerequisite';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import PrerequisitePredicateRow from './prerequisite-predicate-row';

interface PrerequisiteNodeEditorProps {
    nodeExpression: PrerequisiteExpression;
    referencableQuestions: FormQuestion[];
    otherSiblingPredicates: PrerequisitePredicate[];
    onNodeExpressionChange: (
        nextNodeExpression: PrerequisiteExpression,
    ) => void;
    onRemoveNode: () => void;
    canRemoveNode: boolean;
}

export default function PrerequisiteNodeEditor({
    nodeExpression,
    referencableQuestions,
    otherSiblingPredicates,
    onNodeExpressionChange,
    onRemoveNode,
    canRemoveNode,
}: PrerequisiteNodeEditorProps) {
    if ('questionId' in nodeExpression) {
        return (
            <PrerequisitePredicateRow
                predicate={nodeExpression}
                otherSiblingPredicates={otherSiblingPredicates}
                referencableQuestions={referencableQuestions}
                onPredicateChange={onNodeExpressionChange}
                onRemovePredicate={onRemoveNode}
            />
        );
    }

    const groupParts = getPrerequisiteGroupParts(nodeExpression);
    if (!groupParts) return null;
    const { connector: groupConnector, childExpressions } = groupParts;

    const directChildPredicates = childExpressions.filter(
        (childExpression): childExpression is PrerequisitePredicate =>
            'questionId' in childExpression,
    );

    function replaceChildExpressionAt(
        targetChildIndex: number,
        nextChildExpression: PrerequisiteExpression | null,
    ) {
        const nextChildExpressions =
            nextChildExpression === null
                ? childExpressions.filter(
                      (_, index) => index !== targetChildIndex,
                  )
                : childExpressions.map((childExpression, index) =>
                      index === targetChildIndex
                          ? nextChildExpression
                          : childExpression,
                  );
        const nextGroupExpression = buildPrerequisiteGroup(
            groupConnector,
            nextChildExpressions,
        );
        if (!nextGroupExpression) {
            onRemoveNode();
            return;
        }
        onNodeExpressionChange(nextGroupExpression);
    }

    function changeGroupConnector(nextConnector: PrerequisiteGroupConnector) {
        const nextGroupExpression = buildPrerequisiteGroup(
            nextConnector,
            childExpressions,
        );
        if (!nextGroupExpression) return;
        onNodeExpressionChange(nextGroupExpression);
    }

    function addChildPredicate() {
        const newChildPredicate = findFirstAvailablePredicate(
            referencableQuestions,
            directChildPredicates,
        );
        if (!newChildPredicate) return;
        const nextGroupExpression = buildPrerequisiteGroup(groupConnector, [
            ...childExpressions,
            newChildPredicate,
        ]);
        if (!nextGroupExpression) return;
        onNodeExpressionChange(nextGroupExpression);
    }

    function addChildSubGroup() {
        const firstPredicateInNewSubGroup = findFirstAvailablePredicate(
            referencableQuestions,
            [],
        );
        if (!firstPredicateInNewSubGroup) return;
        const newChildSubGroup = buildPrerequisiteGroup('all', [
            firstPredicateInNewSubGroup,
        ]);
        if (!newChildSubGroup) return;
        const nextGroupExpression = buildPrerequisiteGroup(groupConnector, [
            ...childExpressions,
            newChildSubGroup,
        ]);
        if (!nextGroupExpression) return;
        onNodeExpressionChange(nextGroupExpression);
    }

    const canAddChildPredicate =
        findFirstAvailablePredicate(
            referencableQuestions,
            directChildPredicates,
        ) !== null;
    const canAddChildSubGroup = referencableQuestions.length > 0;

    return (
        <div className="border-border bg-muted/30 space-y-3 rounded-md border p-3">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-sm">Show when</span>
                <Select
                    value={groupConnector}
                    onValueChange={nextConnectorValue =>
                        changeGroupConnector(
                            nextConnectorValue as PrerequisiteGroupConnector,
                        )
                    }
                >
                    <SelectTrigger size="sm" className="min-w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(
                            PREREQUISITE_GROUP_CONNECTOR_LABELS,
                        ).map(([connectorValue, connectorLabel]) => (
                            <SelectItem
                                key={connectorValue}
                                value={connectorValue}
                            >
                                {connectorLabel}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {canRemoveNode && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onRemoveNode}
                        className="text-muted-foreground hover:text-destructive ml-auto"
                    >
                        <Trash2 />
                        Remove group
                    </Button>
                )}
            </div>
            <ul className="space-y-2">
                {childExpressions.map((childExpression, childIndex) => {
                    const otherSiblingPredicatesForChild =
                        directChildPredicates.filter(
                            siblingPredicate =>
                                siblingPredicate !== childExpression,
                        );
                    return (
                        <li key={childIndex}>
                            <PrerequisiteNodeEditor
                                nodeExpression={childExpression}
                                referencableQuestions={referencableQuestions}
                                otherSiblingPredicates={
                                    otherSiblingPredicatesForChild
                                }
                                onNodeExpressionChange={nextChildExpression =>
                                    replaceChildExpressionAt(
                                        childIndex,
                                        nextChildExpression,
                                    )
                                }
                                onRemoveNode={() =>
                                    replaceChildExpressionAt(childIndex, null)
                                }
                                canRemoveNode={true}
                            />
                        </li>
                    );
                })}
            </ul>
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addChildPredicate}
                    disabled={!canAddChildPredicate}
                >
                    <Plus />
                    Add condition
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addChildSubGroup}
                    disabled={!canAddChildSubGroup}
                >
                    <Plus />
                    Add group
                </Button>
            </div>
        </div>
    );
}
