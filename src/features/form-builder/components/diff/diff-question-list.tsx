import type { Form } from '@/api/form/contracts/form-schema';
import type { QuestionDiff } from '../../utils/form-version-diff';
import { Card } from '@/components/ui/card';
import DiffQuestionPair from './diff-question-pair';

interface DiffQuestionListProps {
    questionDiffs: QuestionDiff[];
    fromForm: Form;
    toForm: Form;
    fromColumnLabel: string;
    toColumnLabel: string;
}

export default function DiffQuestionList({
    questionDiffs,
    fromForm,
    toForm,
    fromColumnLabel,
    toColumnLabel,
}: DiffQuestionListProps) {
    if (questionDiffs.length === 0) {
        return (
            <Card className="gap-0 p-0">
                <div className="text-muted-foreground px-5 py-8 text-center text-sm">
                    No questions to show.
                </div>
            </Card>
        );
    }

    return (
        <Card className="gap-0 p-5">
            <div className="relative">
                <div className="bg-border pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2" />
                <div className="mb-3 grid grid-cols-2 gap-x-6 border-b pb-3 text-xs font-semibold tracking-wide uppercase">
                    <div className="text-foreground">{fromColumnLabel}</div>
                    <div className="text-foreground">{toColumnLabel}</div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {questionDiffs.map(questionDiff => (
                        <DiffQuestionPair
                            key={`${questionDiff.kind}-${questionDiff.toQuestion?.id ?? questionDiff.fromQuestion?.id}`}
                            questionDiff={questionDiff}
                            fromForm={fromForm}
                            toForm={toForm}
                            depth={0}
                        />
                    ))}
                </div>
            </div>
        </Card>
    );
}
