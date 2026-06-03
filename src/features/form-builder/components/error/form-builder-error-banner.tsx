import { Button } from '@/components/ui/button';
import {
    networkErrorMessage,
    type NetworkError,
} from '@/lib/network/network-error';
import { AlertCircle } from 'lucide-react';

interface FormBuilderErrorBannerProps {
    title?: string;
    error: NetworkError;
    onRetry?: () => void;
}

export default function FormBuilderErrorBanner({
    title = 'Something went wrong',
    error,
    onRetry,
}: FormBuilderErrorBannerProps) {
    return (
        <div
            role="alert"
            className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border p-4 text-sm"
        >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div className="flex-1 space-y-1">
                <p className="font-medium">{title}</p>
                <p className="text-destructive/80">
                    {networkErrorMessage(error)}
                </p>
            </div>
            {onRetry && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRetry}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive -my-1"
                >
                    Retry
                </Button>
            )}
        </div>
    );
}
