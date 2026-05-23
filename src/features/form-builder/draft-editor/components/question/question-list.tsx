import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type { Form } from '@/api/form/contracts/form-schema';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import NoQuestionsEmptyState from '../empty-state/no-questions-empty-state';
import { Card } from '@/components/ui/card';
import QuestionCard from './question-card';

interface QuestionListProps {
    draft: Form;
    onAddQuestion: (parentId: number | null) => void;
    onEditQuestion: (question: FormQuestion) => void;
    onDeleteQuestion: (question: FormQuestion) => void;
}

export default function QuestionList({
    draft,
    onAddQuestion,
    onEditQuestion,
    onDeleteQuestion,
}: QuestionListProps) {
    const rootQuestions = (draft.questions ?? [])
        .slice()
        .sort((a, b) => a.order - b.order);

    return (
        <section className="space-y-2.5">
            <div className="flex items-center justify-between">
                <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                    Questions
                </h2>
                {rootQuestions.length > 0 && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAddQuestion(null)}
                    >
                        <Plus />
                        Add question
                    </Button>
                )}
            </div>
            {rootQuestions.length === 0 ? (
                <NoQuestionsEmptyState
                    onAddQuestion={() => onAddQuestion(null)}
                />
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
