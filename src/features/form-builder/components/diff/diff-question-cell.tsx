import type { Form } from '@/api/form/contracts/form-schema';
import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type { QuestionDiff } from '../../utils/form-version-diff';
import { describePrerequisite } from '../../utils/prerequisite';
import { QUESTION_TYPE_LABELS } from '../../utils/question-type-labels';
import { Badge } from '@/components/ui/badge';
import { Fragment } from 'react';

interface DiffQuestionCellProps {
    question: FormQuestion;
    form: Form;
    side: 'left' | 'right';
    diffKind: QuestionDiff['kind'];
    fieldChanges: QuestionDiff['fieldChanges'];
}

const STYLE_BY_DIFF_KIND: Record<
    QuestionDiff['kind'],
    {
        cardClass: string;
        markerSymbol: string;
        markerClass: string;
        badgeLabel: string;
        badgeClass: string;
    }
> = {
    added: {
        cardClass:
            'border border-success/30 border-l-4 border-l-success bg-success/5',
        markerSymbol: '+',
        markerClass: 'text-success',
        badgeLabel: 'Added',
        badgeClass: 'border-success/40 bg-success/10 text-success',
    },
    removed: {
        cardClass:
            'border border-destructive/30 border-l-4 border-l-destructive bg-destructive/5',
        markerSymbol: '-',
        markerClass: 'text-destructive',
        badgeLabel: 'Removed',
        badgeClass: 'border-destructive/40 bg-destructive/10 text-destructive',
    },
    modified: {
        cardClass:
            'border border-amber-200/60 border-l-4 border-l-amber-500 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/30',
        markerSymbol: '±',
        markerClass: 'text-amber-700 dark:text-amber-300',
        badgeLabel: 'Modified',
        badgeClass:
            'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
    },
    unchanged: {
        cardClass: 'border border-border bg-card',
        markerSymbol: '',
        markerClass: '',
        badgeLabel: '',
        badgeClass: '',
    },
};

export default function DiffQuestionCell({
    question,
    form,
    side,
    diffKind,
    fieldChanges,
}: DiffQuestionCellProps) {
    const style = STYLE_BY_DIFF_KIND[diffKind];
    const changedFieldHighlightClass =
        side === 'left'
            ? 'bg-destructive/20 text-destructive rounded px-1'
            : 'bg-success/20 text-success rounded px-1';

    const requirednessLabel = question.required ? 'Required' : 'Optional';
    const prerequisitePreview = describePrerequisite(
        question.prerequisite,
        form,
    );

    const optionsForThisSide = question.options ?? [];
    const optionsRemovedFromLeftSide = new Set(
        fieldChanges.options?.removed ?? [],
    );
    const optionsAddedOnRightSide = new Set(fieldChanges.options?.added ?? []);

    const isLabelChanged = Boolean(fieldChanges.label);
    const isTypeChanged = Boolean(fieldChanges.type);
    const isRequirednessChanged = Boolean(fieldChanges.required);
    const isPrerequisiteChanged = Boolean(fieldChanges.prerequisite);
    const isOptionsChanged = Boolean(fieldChanges.options);
    const isParentChanged = Boolean(fieldChanges.parent);

    return (
        <div className={`h-full rounded-md shadow-sm ${style.cardClass}`}>
            <div className="flex items-start gap-2.5 px-3.5 py-3">
                {style.markerSymbol && (
                    <div
                        className={`w-4 shrink-0 pt-0.5 text-center font-mono text-base leading-none font-semibold ${style.markerClass}`}
                        aria-label={style.badgeLabel}
                    >
                        {style.markerSymbol}
                    </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                    <div
                        className={`text-sm font-medium ${
                            isLabelChanged ? changedFieldHighlightClass : ''
                        }`}
                    >
                        {question.label}
                    </div>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span
                            className={
                                isTypeChanged ? changedFieldHighlightClass : ''
                            }
                        >
                            {QUESTION_TYPE_LABELS[question.type]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                            className={
                                isRequirednessChanged
                                    ? changedFieldHighlightClass
                                    : ''
                            }
                        >
                            {requirednessLabel}
                        </span>
                        {prerequisitePreview && (
                            <Fragment>
                                <span aria-hidden="true">·</span>
                                <span
                                    className={
                                        isPrerequisiteChanged
                                            ? changedFieldHighlightClass
                                            : ''
                                    }
                                >
                                    Shown when {prerequisitePreview}
                                </span>
                            </Fragment>
                        )}
                    </div>
                    {isOptionsChanged && optionsForThisSide.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                            {optionsForThisSide.map(optionLabel => {
                                const isOptionLeavingOnLeftSide =
                                    side === 'left' &&
                                    optionsRemovedFromLeftSide.has(optionLabel);
                                const isOptionArrivingOnRightSide =
                                    side === 'right' &&
                                    optionsAddedOnRightSide.has(optionLabel);
                                let optionPillClass =
                                    'text-muted-foreground border border-border bg-background/70 rounded px-1.5 py-0.5';
                                if (isOptionLeavingOnLeftSide) {
                                    optionPillClass =
                                        'bg-destructive/20 text-destructive line-through rounded px-1.5 py-0.5';
                                } else if (isOptionArrivingOnRightSide) {
                                    optionPillClass =
                                        'bg-success/20 text-success rounded px-1.5 py-0.5';
                                }
                                return (
                                    <span
                                        key={optionLabel}
                                        className={optionPillClass}
                                    >
                                        {optionLabel}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                    {isParentChanged && (
                        <div className="text-muted-foreground text-xs">
                            <span className={changedFieldHighlightClass}>
                                {describeParentSide(side, fieldChanges.parent)}
                            </span>
                        </div>
                    )}
                </div>
                {style.badgeLabel && (
                    <Badge
                        variant="outline"
                        className={`shrink-0 ${style.badgeClass}`}
                    >
                        {style.badgeLabel}
                    </Badge>
                )}
            </div>
        </div>
    );
}

function describeParentSide(
    side: 'left' | 'right',
    parentChange: QuestionDiff['fieldChanges']['parent'],
): string {
    if (!parentChange) return '';
    if (side === 'left') {
        return parentChange.from
            ? `Was a follow-up under "${parentChange.from.label}"`
            : 'Was a top-level question';
    }
    return parentChange.to
        ? `Now a follow-up under "${parentChange.to.label}"`
        : 'Now a top-level question';
}
