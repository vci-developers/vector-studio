import type { Form } from '@/api/form/contracts/form-schema';
import type { QuestionDiff } from '../../utils/form-version-diff';
import DiffQuestionCell from './diff-question-cell';
import { Fragment } from 'react';

interface DiffQuestionPairProps {
    questionDiff: QuestionDiff;
    fromForm: Form;
    toForm: Form;
    depth: number;
}

export default function DiffQuestionPair({
    questionDiff,
    fromForm,
    toForm,
    depth,
}: DiffQuestionPairProps) {
    const { kind, fromQuestion, toQuestion, fieldChanges, children } =
        questionDiff;

    const cellIndentStyle =
        depth > 0 ? { marginLeft: `${depth * 24}px` } : undefined;

    return (
        <Fragment>
            <div style={cellIndentStyle}>
                {fromQuestion ? (
                    <DiffQuestionCell
                        question={fromQuestion}
                        form={fromForm}
                        side="left"
                        diffKind={kind}
                        fieldChanges={fieldChanges}
                    />
                ) : (
                    <div className="text-muted-foreground border-border bg-muted/40 flex h-full items-center justify-center rounded-md border border-dashed px-3 py-6 text-xs italic">
                        Not in this version
                    </div>
                )}
            </div>
            <div style={cellIndentStyle}>
                {toQuestion ? (
                    <DiffQuestionCell
                        question={toQuestion}
                        form={toForm}
                        side="right"
                        diffKind={kind}
                        fieldChanges={fieldChanges}
                    />
                ) : (
                    <div className="text-muted-foreground border-border bg-muted/40 flex h-full items-center justify-center rounded-md border border-dashed px-3 py-6 text-xs italic">
                        Not in your draft
                    </div>
                )}
            </div>
            {children.map(childDiff => (
                <DiffQuestionPair
                    key={`${childDiff.kind}-${childDiff.toQuestion?.id ?? childDiff.fromQuestion?.id}`}
                    questionDiff={childDiff}
                    fromForm={fromForm}
                    toForm={toForm}
                    depth={depth + 1}
                />
            ))}
        </Fragment>
    );
}
