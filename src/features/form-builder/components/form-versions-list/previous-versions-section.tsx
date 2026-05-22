'use client';

import { useGetCurrentFormByProgramId } from '@/api/form/hooks/use-get-current-form-by-program-id';
import FormVersionsSection from './form-versions-section';
import { Skeleton } from '@/components/ui/skeleton';
import FormErrorBanner from '../error/form-error-banner';
import { useGetFormsByProgramId } from '@/api/form/hooks/use-get-forms-by-program-id';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import PreviousVersionsEmptyState from '../empty-state/previous-versions-empty-state';

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
            <FormVersionsSection label="Previously published">
                <Skeleton className="h-24 w-full rounded-xl" />
            </FormVersionsSection>
        );
    }

    if (!getFormsByProgramIdResult.ok) {
        return (
            <FormVersionsSection label="Previously published">
                <FormErrorBanner
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
            </FormVersionsSection>
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
            <FormVersionsSection label="Previously published">
                <PreviousVersionsEmptyState />
            </FormVersionsSection>
        );
    }

    return (
        <FormVersionsSection label="Previously published">
            <ul className="border-border bg-card divide-border divide-y overflow-hidden rounded-xl border">
                {previouslyPublishedForms.map(form => (
                    <li key={form.id}>
                        <Link
                            href={`/forms/${form.version}`}
                            className="hover:bg-muted/50 flex items-center justify-between gap-4 px-4 py-3 transition-colors"
                        >
                            <div className="space-y-0.5">
                                <div className="text-sm font-medium">
                                    {form.name}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    Version {form.version} · Published{' '}
                                    {format(
                                        new Date(form.createdAt * 1000),
                                        'MMM d, yyyy',
                                    )}
                                </div>
                            </div>
                            <ChevronRight className="text-muted-foreground size-4" />
                        </Link>
                    </li>
                ))}
            </ul>
        </FormVersionsSection>
    );
}
