'use client';

import { useGetCurrentFormByProgramId } from '@/api/form/hooks/use-get-current-form-by-program-id';
import FormVersionsSection from './form-versions-section';
import { Skeleton } from '@/components/ui/skeleton';
import FormErrorBanner from '../error/form-error-banner';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import NoCurrentFormEmptyState from '../empty-state/no-current-form-empty-state';

interface CurrentVersionSectionProps {
    programId: number;
}

export default function CurrentVersionSection({
    programId,
}: CurrentVersionSectionProps) {
    const {
        data: getCurrentFormByProgramIdResult,
        isPending: isGetCurrentFormByProgramIdPending,
        refetch: refetchCurrentFormByProgramId,
    } = useGetCurrentFormByProgramId(programId);

    if (
        !getCurrentFormByProgramIdResult ||
        isGetCurrentFormByProgramIdPending
    ) {
        return (
            <FormVersionsSection label="Current version">
                <Skeleton className="h-24 w-full rounded-xl" />
            </FormVersionsSection>
        );
    }

    if (!getCurrentFormByProgramIdResult.ok) {
        if (getCurrentFormByProgramIdResult.error.kind !== 'not_found') {
            return (
                <FormVersionsSection label="Current version">
                    <FormErrorBanner
                        title="Couldn't load the current version"
                        error={
                            getCurrentFormByProgramIdResult.error ?? {
                                kind: 'unknown',
                            }
                        }
                        onRetry={() => {
                            void refetchCurrentFormByProgramId();
                        }}
                    />
                </FormVersionsSection>
            );
        } else {
            return (
                <FormVersionsSection label="Current version">
                    <NoCurrentFormEmptyState />
                </FormVersionsSection>
            );
        }
    }

    const currentForm = getCurrentFormByProgramIdResult.data;

    return (
        <FormVersionsSection label="Current version">
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle>{currentForm.name}</CardTitle>
                            <CardDescription>
                                Version {currentForm.version} · Published{' '}
                                {format(
                                    new Date(currentForm.createdAt * 1000),
                                    'MMM d, yyyy',
                                )}
                            </CardDescription>
                        </div>
                        <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            Active
                        </Badge>
                    </div>
                </CardHeader>
            </Card>
        </FormVersionsSection>
    );
}
