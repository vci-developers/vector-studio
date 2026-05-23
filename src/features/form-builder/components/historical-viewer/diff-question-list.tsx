import type { Form } from '@/api/form/contracts/form-schema';
import type { QuestionDiff } from '../../utils/form-version-diff';
import { Card } from '@/components/ui/card';
import DiffQuestionCard from './diff-question-card';

interface DiffQuestionListProps {
    questionDiffs: QuestionDiff[];
    fromForm: Form;
    toForm: Form;
}

export default function DiffQuestionList({
    questionDiffs,
    fromForm,
    toForm,
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
        <Card className="divide-border gap-0 divide-y p-0">
            {questionDiffs.map(questionDiff => (
                <DiffQuestionCard
                    key={`${questionDiff.kind}-${questionDiff.question.id}`}
                    questionDiff={questionDiff}
                    fromForm={fromForm}
                    toForm={toForm}
                />
            ))}
        </Card>
    );
}
