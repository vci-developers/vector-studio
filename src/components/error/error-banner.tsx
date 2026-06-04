import {
    networkErrorMessage,
    type NetworkError,
} from '@/lib/network/network-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorBannerProps {
    title?: string;
    error: NetworkError;
    onRetry?: () => void;
}

export default function ErrorBanner({
    title = 'Something went wrong',
    error,
    onRetry,
}: ErrorBannerProps) {
    return (
        <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{networkErrorMessage(error)}</AlertDescription>
            {onRetry && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="col-start-2 mt-3 w-fit"
                >
                    Retry
                </Button>
            )}
        </Alert>
    );
}
