import type { Form } from '@/api/form/contracts/form-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

interface HistoricalViewerHeaderProps {
    viewedForm: Form;
    onRequestCheckout: () => void;
}

export default function HistoricalViewerHeader({
    viewedForm,
    onRequestCheckout,
}: HistoricalViewerHeaderProps) {
    return (
        <Card className="gap-0 p-0">
            <div className="space-y-2 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
                        <Badge variant="outline">
                            Version {viewedForm.version}
                        </Badge>
                        <span aria-hidden="true">·</span>
                        <span>
                            Published{' '}
                            {format(
                                new Date(viewedForm.createdAt),
                                'MMM d, yyyy',
                            )}
                        </span>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onRequestCheckout}
                    >
                        Check out version
                    </Button>
                </div>
                <div className="text-base font-medium">{viewedForm.name}</div>
            </div>
        </Card>
    );
}
