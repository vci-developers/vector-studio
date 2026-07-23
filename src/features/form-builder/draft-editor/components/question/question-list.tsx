import type {
    FormQuestion,
    FormQuestionScope,
} from '@/api/form-question/contracts/form-question-schema';
import type { Form } from '@/api/form/contracts/form-schema';
import QuestionScopeSection from './question-scope-section';

interface QuestionListProps {
    draft: Form;
    onAddQuestion: (
        parentId: number | null,
        answerScope: FormQuestionScope,
    ) => void;
    onEditQuestion: (question: FormQuestion) => void;
    onDeleteQuestion: (question: FormQuestion) => void;
}

export default function QuestionList({
    draft,
    onAddQuestion,
    onEditQuestion,
    onDeleteQuestion,
}: QuestionListProps) {
    return (
        <div className="space-y-6">
            <QuestionScopeSection
                scope="SESSION"
                title="Session questions"
                note="Answered once for the whole visit — like the weather, the collector, or the site condition."
                emptyStateNote="No session questions yet. Add anything answered just once per visit."
                draft={draft}
                onAddQuestion={onAddQuestion}
                onEditQuestion={onEditQuestion}
                onDeleteQuestion={onDeleteQuestion}
            />
            <QuestionScopeSection
                scope="SESSION_UNIT"
                title="Per-collection batch questions"
                note="Answered again for each repeatable collection batch within a visit — like each trap, each room, or each hour of a human landing catch (HLC)."
                emptyStateNote="No per-collection batch questions yet. Add these only if a visit repeats the same questions across several collections — for example, one set of answers per HLC hour."
                draft={draft}
                onAddQuestion={onAddQuestion}
                onEditQuestion={onEditQuestion}
                onDeleteQuestion={onDeleteQuestion}
            />
        </div>
    );
}
