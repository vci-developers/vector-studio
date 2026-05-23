import type { Form } from '@/api/form/contracts/form-schema';
import type { QuestionDiff } from '../../utils/form-version-diff';
import { describePrerequisite } from '../../utils/form-question-prerequisite';
import { QUESTION_TYPE_LABELS } from '../../utils/question-type-labels';
import { Fragment } from 'react';
import { Badge } from '@/components/ui/badge';
import DiffScalarChange from './diff-scalar-change';
import DiffFieldChangeRow from './diff-field-change-row';

const DIFF_KIND_STYLING: Record<
    QuestionDiff['kind'],
    {
        borderClass: string;
        markerClass: string;
        markerSymbol: string;
        statusLabel: string;
    }
> = {
    added: {
        borderClass: 'border-l-success bg-success/5',
        markerClass: 'text-success',
        markerSymbol: '+',
        statusLabel: 'Added',
    },
    removed: {
        borderClass: 'border-l-destructive bg-destructive/5',
        markerClass: 'text-destructive',
        markerSymbol: '-',
        statusLabel: 'Removed',
    },
    modified: {
        borderClass: 'border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/30',
        markerClass: 'text-amber-700 dark:text-amber-300',
        markerSymbol: '±',
        statusLabel: 'Modified',
    },
    unchanged: {
        borderClass: 'border-l-transparent',
        markerClass: 'text-muted-foreground/50',
        markerSymbol: '',
        statusLabel: 'Unchanged',
    },
};

interface DiffQuestionCardProps {
    questionDiff: QuestionDiff;
    fromForm: Form;
    toForm: Form;
}

export default function DiffQuestionCard({
    questionDiff,
    fromForm,
    toForm,
}: DiffQuestionCardProps) {
    const {
        kind: diffKind,
        question,
        fieldChanges,
        children: childDiffs,
    } = questionDiff;
    const styling = DIFF_KIND_STYLING[diffKind];

    const formForPrerequisiteLookup =
        diffKind === 'removed' ? fromForm : toForm;
    const prerequisitePreview = describePrerequisite(
        question.prerequisite,
        formForPrerequisiteLookup,
    );

    const isModified = diffKind === 'modified';
    const hasAnyFieldChange = Object.keys(fieldChanges).length > 0;

    return (
        <div className={`border-l-4 ${styling.borderClass}`}>
            <div className="flex items-start gap-3 px-4 py-3.5">
                <div
                    className={`${styling.markerClass} w-4 shrink-0 pt-0.5 text-center font-mono text-base leading-none font-semibold`}
                    aria-label={styling.statusLabel}
                >
                    {styling.markerSymbol}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                    <div
                        className={`text-sm font-medium ${
                            diffKind === 'removed'
                                ? 'text-foreground/80 line-through'
                                : ''
                        }`}
                    >
                        {question.label}
                    </div>
                    <div className="text-muted-foreground flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-xs">
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
                    </div>
                </div>
                {diffKind !== 'unchanged' && (
                    <Badge
                        variant="outline"
                        className={`shrink-0 ${styling.markerClass}`}
                    >
                        {styling.statusLabel}
                    </Badge>
                )}
            </div>

            {isModified && hasAnyFieldChange && (
                <div className="border-border/60 bg-background/60 mr-4 mb-3 ml-11 space-y-1.5 rounded-md border px-3 py-2">
                    {fieldChanges.label && (
                        <DiffFieldChangeRow label="Label">
                            <DiffScalarChange
                                fromText={`"${fieldChanges.label.from}"`}
                                toText={`"${fieldChanges.label.to}"`}
                            />
                        </DiffFieldChangeRow>
                    )}
                    {fieldChanges.type && (
                        <DiffFieldChangeRow label="Type">
                            <DiffScalarChange
                                fromText={
                                    QUESTION_TYPE_LABELS[fieldChanges.type.from]
                                }
                                toText={
                                    QUESTION_TYPE_LABELS[fieldChanges.type.to]
                                }
                            />
                        </DiffFieldChangeRow>
                    )}
                    {fieldChanges.required && (
                        <DiffFieldChangeRow label="Required">
                            <DiffScalarChange
                                fromText={
                                    fieldChanges.required.from
                                        ? 'Required'
                                        : 'Optional'
                                }
                                toText={
                                    fieldChanges.required.to
                                        ? 'Required'
                                        : 'Optional'
                                }
                            />
                        </DiffFieldChangeRow>
                    )}
                    {fieldChanges.options && (
                        <DiffFieldChangeRow label="Options">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                {fieldChanges.options.added.map(addedOption => (
                                    <span
                                        key={`added-${addedOption}`}
                                        className="text-success"
                                    >
                                        +&nbsp;&quot;{addedOption}&quot;
                                    </span>
                                ))}
                                {fieldChanges.options.removed.map(
                                    removedOption => (
                                        <span
                                            key={`removed-${removedOption}`}
                                            className="text-destructive line-through"
                                        >
                                            -&nbsp;&quot;{removedOption}&quot;
                                        </span>
                                    ),
                                )}
                            </div>
                        </DiffFieldChangeRow>
                    )}
                    {fieldChanges.prerequisite && (
                        <DiffFieldChangeRow label="Shown when">
                            <div className="space-y-0.5">
                                <div>
                                    <span className="text-muted-foreground">
                                        Was:{' '}
                                    </span>
                                    <span className="text-destructive line-through">
                                        {describePrerequisite(
                                            fieldChanges.prerequisite.from,
                                            fromForm,
                                        ) ?? 'Always shown'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">
                                        Now:{' '}
                                    </span>
                                    <span className="text-success">
                                        {describePrerequisite(
                                            fieldChanges.prerequisite.to,
                                            toForm,
                                        ) ?? 'Always shown'}
                                    </span>
                                </div>
                            </div>
                        </DiffFieldChangeRow>
                    )}
                    {fieldChanges.parent && (
                        <DiffFieldChangeRow label="Parent">
                            <DiffScalarChange
                                fromText={
                                    fieldChanges.parent.from
                                        ? `"${fieldChanges.parent.from.label}"`
                                        : '(root level)'
                                }
                                toText={
                                    fieldChanges.parent.to
                                        ? `"${fieldChanges.parent.to.label}"`
                                        : '(root level)'
                                }
                            />
                        </DiffFieldChangeRow>
                    )}
                </div>
            )}

            {childDiffs.length > 0 && (
                <div className="border-border/60 divide-border/60 ml-11 divide-y border-l">
                    {childDiffs.map(childDiff => (
                        <DiffQuestionCard
                            key={`${childDiff.kind}-${childDiff.question.id}`}
                            questionDiff={childDiff}
                            fromForm={fromForm}
                            toForm={toForm}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
