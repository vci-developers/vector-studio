import type {
    FormQuestion,
    FormQuestionScope,
} from '@/api/form-question/contracts/form-question-schema';
import type { Form } from '@/api/form/contracts/form-schema';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import QuestionCard from './question-card';

interface QuestionScopeSectionProps {
    scope: FormQuestionScope;
    title: string;
    note: string;
    emptyStateNote: string;
    draft: Form;
    onAddQuestion: (
        parentId: number | null,
        answerScope: FormQuestionScope,
    ) => void;
    onEditQuestion: (question: FormQuestion) => void;
    onDeleteQuestion: (question: FormQuestion) => void;
}

export default function QuestionScopeSection({
    scope,
    title,
    note,
    emptyStateNote,
    draft,
    onAddQuestion,
    onEditQuestion,
    onDeleteQuestion,
}: QuestionScopeSectionProps) {
    const rootQuestions = (draft.questions ?? [])
        .filter(question => question.answerScope === scope)
        .sort((a, b) => a.order - b.order);

    return (
        <section className="space-y-2.5">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                        {title}
                    </h2>
                    <p className="text-muted-foreground max-w-prose text-xs">
                        {note}
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddQuestion(null, scope)}
                >
                    <Plus />
                    Add question
                </Button>
            </div>
            {rootQuestions.length === 0 ? (
                <Card>
                    <p className="text-muted-foreground max-w-prose px-6 text-sm">
                        {emptyStateNote}
                    </p>
                </Card>
            ) : (
                <Card className="divide-border gap-0 divide-y p-0">
                    {rootQuestions.map((question, index) => (
                        <QuestionCard
                            key={question.id}
                            question={question}
                            siblings={rootQuestions}
                            siblingIndex={index}
                            draft={draft}
                            onAddQuestion={onAddQuestion}
                            onEditQuestion={onEditQuestion}
                            onDeleteQuestion={onDeleteQuestion}
                        />
                    ))}
                </Card>
            )}
        </section>
    );
}
