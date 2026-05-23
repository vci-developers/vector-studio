'use client';

import { useGetCurrentFormByProgramId } from '@/api/form/hooks/use-get-current-form-by-program-id';
import VersionsSection from './versions-section';
import { Skeleton } from '@/components/ui/skeleton';
import FormBuilderErrorBanner from '../../../components/error/form-builder-error-banner';
import { format } from 'date-fns';
import NoCurrentFormEmptyState from '../empty-state/no-current-form-empty-state';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
            <VersionsSection label="Current version">
                <Card className="gap-0 p-0">
                    <div className="flex items-center gap-4 px-4 py-3.5">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-56" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                        <Skeleton className="size-4 shrink-0" />
                    </div>
                </Card>
            </VersionsSection>
        );
    }

    if (!getCurrentFormByProgramIdResult.ok) {
        if (getCurrentFormByProgramIdResult.error.kind !== 'not_found') {
            return (
                <VersionsSection label="Current version">
                    <FormBuilderErrorBanner
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
                </VersionsSection>
            );
        } else {
            return (
                <VersionsSection label="Current version">
                    <NoCurrentFormEmptyState />
                </VersionsSection>
            );
        }
    }

    const currentForm = getCurrentFormByProgramIdResult.data;

    return (
        <VersionsSection label="Current version">
            <Card className="gap-0 p-0">
                <Link
                    href={`/forms/${currentForm.version}`}
                    className="group hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-ring/60 flex items-center gap-4 px-4 py-3.5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
                >
                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2.5">
                            <span className="truncate text-sm font-medium">
                                {currentForm.name}
                            </span>
                            <span className="text-muted-foreground inline-flex shrink-0 items-center gap-1.5 text-xs font-medium">
                                <span
                                    className="bg-success size-1.5 rounded-full"
                                    aria-hidden="true"
                                />
                                Active
                            </span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                            Version {currentForm.version} · Published{' '}
                            {format(
                                new Date(currentForm.createdAt),
                                'MMM d, yyyy',
                            )}
                        </div>
                    </div>
                    <ChevronRight className="text-muted-foreground/60 group-hover:text-muted-foreground size-4 shrink-0 transition-colors" />
                </Link>
            </Card>
        </VersionsSection>
    );
}
