'use client';

import { useGetCurrentFormByProgramId } from '@/api/form/hooks/use-get-current-form-by-program-id';
import VersionsSection from './versions-section';
import { Skeleton } from '@/components/ui/skeleton';
import FormBuilderErrorBanner from '../../../components/error/form-builder-error-banner';
import { useGetFormsByProgramId } from '@/api/form/hooks/use-get-forms-by-program-id';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import PreviousVersionsEmptyState from '../empty-state/previous-versions-empty-state';
import { Card } from '@/components/ui/card';

const DRAFT_VERSION_TOKEN = '';

interface PreviousVersionsSectionProps {
    programId: number;
}

export default function PreviousVersionsSection({
    programId,
}: PreviousVersionsSectionProps) {
    const {
        data: getFormsByProgramIdResult,
        isPending: isGetFormsByProgramIdPending,
        refetch: refetchFormsByProgramId,
    } = useGetFormsByProgramId(programId);
    const { data: getCurrentFormByProgramIdResult } =
        useGetCurrentFormByProgramId(programId);

    if (!getFormsByProgramIdResult || isGetFormsByProgramIdPending) {
        return (
            <VersionsSection label="Previously published">
                <Card className="divide-border gap-0 divide-y p-0">
                    {[0, 1].map(i => (
                        <div
                            key={i}
                            className="flex items-center gap-4 px-4 py-3.5"
                        >
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-52" />
                                <Skeleton className="h-3 w-36" />
                            </div>
                            <Skeleton className="size-4 shrink-0" />
                        </div>
                    ))}
                </Card>
            </VersionsSection>
        );
    }

    if (!getFormsByProgramIdResult.ok) {
        return (
            <VersionsSection label="Previously published">
                <FormBuilderErrorBanner
                    title="Couldn't load published versions"
                    error={
                        getFormsByProgramIdResult.error ?? {
                            kind: 'unknown',
                        }
                    }
                    onRetry={() => {
                        void refetchFormsByProgramId();
                    }}
                />
            </VersionsSection>
        );
    }

    const currentFormVersion = getCurrentFormByProgramIdResult?.ok
        ? getCurrentFormByProgramIdResult.data.version
        : null;

    const previouslyPublishedForms = getFormsByProgramIdResult.data.forms
        .filter(
            form =>
                form.version !== DRAFT_VERSION_TOKEN &&
                form.version !== currentFormVersion,
        )
        .sort((a, b) => b.createdAt - a.createdAt);

    if (previouslyPublishedForms.length === 0) {
        return (
            <VersionsSection label="Previously published">
                <PreviousVersionsEmptyState />
            </VersionsSection>
        );
    }

    return (
        <VersionsSection label="Previously published">
            <Card className="divide-border gap-0 divide-y p-0">
                {previouslyPublishedForms.map(form => (
                    <Link
                        key={form.id}
                        href={`/forms/${form.version}`}
                        className="group hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-ring/60 flex items-center gap-4 px-4 py-3.5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
                    >
                        <div className="min-w-0 flex-1 space-y-1">
                            <div className="truncate text-sm font-medium">
                                {form.name}
                            </div>
                            <div className="text-muted-foreground text-xs">
                                Version {form.version} · Published{' '}
                                {format(
                                    new Date(form.createdAt),
                                    'MMM d, yyyy',
                                )}
                            </div>
                        </div>
                        <ChevronRight className="text-muted-foreground/60 group-hover:text-muted-foreground size-4 shrink-0 transition-colors" />
                    </Link>
                ))}
            </Card>
        </VersionsSection>
    );
}
