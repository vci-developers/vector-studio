import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ListPlus, Plus } from 'lucide-react';

interface NoQuestionsEmptyStateProps {
    onAddQuestion: () => void;
}

export default function NoQuestionsEmptyState({
    onAddQuestion,
}: NoQuestionsEmptyStateProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ListPlus className="text-muted-foreground size-5" />
                    No questions yet
                </CardTitle>
                <CardDescription>
                    Add your first question to start shaping the form your field
                    workers will fill out.
                </CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
                <Button onClick={onAddQuestion} size="sm">
                    <Plus />
                    Add question
                </Button>
            </div>
        </Card>
    );
}
