'use client';

import type { Form } from '@/api/form/contracts/form-schema';
import { useGetCurrentFormByProgramId } from '@/api/form/hooks/use-get-current-form-by-program-id';
import { useGetFormsByProgramId } from '@/api/form/hooks/use-get-forms-by-program-id';
import { usePublishDraftFormForProgram } from '@/api/form/hooks/use-publish-draft-form-for-program';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { networkErrorMessage } from '@/lib/network/network-error';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { diffFormVersions } from '../../../utils/form-version-diff';
import FormBuilderErrorBanner from '../../../components/error/form-builder-error-banner';
import DiffQuestionList from '../../../components/diff/diff-question-list';
import DiffSummary from '../../../components/diff/diff-summary';

const DRAFT_VERSION_TOKEN = '';

interface PublishSheetProps {
    isOpen: boolean;
    programId: number;
    draftForm: Form;
    onClose: () => void;
}

export default function PublishSheet({
    isOpen,
    programId,
    draftForm,
    onClose,
}: PublishSheetProps) {
    const router = useRouter();
    const [pendingVersion, setPendingVersion] = useState('');

    const {
        data: getCurrentPublishedFormResult,
        isPending: isGetCurrentPublishedFormPending,
        refetch: refetchCurrentPublishedForm,
    } = useGetCurrentFormByProgramId(programId, { enabled: isOpen });
    const { data: getFormsByProgramIdResult } = useGetFormsByProgramId(
        programId,
        { enabled: isOpen },
    );
    const {
        mutate: publishDraftFormForProgram,
        isPending: isPublishDraftFormForProgramPending,
    } = usePublishDraftFormForProgram();

    const previouslyPublishedForms = getFormsByProgramIdResult?.ok
        ? getFormsByProgramIdResult.data.forms
              .filter(form => form.version !== DRAFT_VERSION_TOKEN)
              .sort((a, b) => b.createdAt - a.createdAt)
        : null;
    const latestPublishedVersion =
        previouslyPublishedForms?.[0]?.version ?? null;
    const alreadyPublishedVersionSet = new Set(
        previouslyPublishedForms?.map(form => form.version) ?? [],
    );

    const trimmedVersion = pendingVersion.trim();
    const isVersionEmpty = trimmedVersion.length === 0;
    const isVersionAlreadyUsed =
        previouslyPublishedForms !== null &&
        alreadyPublishedVersionSet.has(trimmedVersion);
    const isPublishDisabled =
        isVersionEmpty ||
        isVersionAlreadyUsed ||
        isPublishDraftFormForProgramPending;

    const currentPublishedForm = getCurrentPublishedFormResult?.ok
        ? getCurrentPublishedFormResult.data
        : null;

    const isFirstPublish =
        !!getCurrentPublishedFormResult &&
        !getCurrentPublishedFormResult.ok &&
        getCurrentPublishedFormResult.error.kind === 'not_found';

    const hasUnexpectedCurrentFormError =
        !!getCurrentPublishedFormResult &&
        !getCurrentPublishedFormResult.ok &&
        !isFirstPublish;

    const formVersionDiff = useMemo(() => {
        if (!currentPublishedForm) return null;
        return diffFormVersions(currentPublishedForm, draftForm);
    }, [currentPublishedForm, draftForm]);

    function publish() {
        if (isPublishDisabled) return;
        publishDraftFormForProgram(
            { programId, requestBody: { version: trimmedVersion } },
            {
                onSuccess: result => {
                    if (!result.ok) {
                        toast.error("Couldn't publish the draft", {
                            description: networkErrorMessage(result.error),
                        });
                        return;
                    }
                    toast.success(`Published version ${trimmedVersion}`);
                    onClose();
                    router.push('/forms');
                },
                onError: () => {
                    toast.error("Couldn't publish the draft", {
                        description:
                            'A network error occurred. Please try again.',
                    });
                },
            },
        );
    }

    return (
        <Sheet
            open={isOpen}
            onOpenChange={open => {
                if (!open) onClose();
            }}
        >
            <SheetContent
                side="right"
                className="flex w-full flex-col gap-0 data-[side=right]:sm:max-w-6xl"
            >
                <SheetHeader className="border-b">
                    <SheetTitle className="text-base">
                        Publish draft as a new version
                    </SheetTitle>
                    <SheetDescription>
                        Review the changes against your active form, then name
                        and publish this version.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-4 py-5">
                    <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                        Changes since current published version
                    </h3>
                    {isGetCurrentPublishedFormPending ? (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                            <Card className="gap-0 p-0">
                                {[0, 1, 2].map(skeletonRowIndex => (
                                    <div
                                        key={skeletonRowIndex}
                                        className="flex items-start gap-3 border-l-4 border-l-transparent px-4 py-3.5"
                                    >
                                        <Skeleton className="size-5 shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-64" />
                                            <Skeleton className="h-3 w-44" />
                                        </div>
                                    </div>
                                ))}
                            </Card>
                        </div>
                    ) : hasUnexpectedCurrentFormError &&
                      getCurrentPublishedFormResult &&
                      !getCurrentPublishedFormResult.ok ? (
                        <FormBuilderErrorBanner
                            title="Couldn't load the current published version"
                            error={getCurrentPublishedFormResult.error}
                            onRetry={() => {
                                void refetchCurrentPublishedForm();
                            }}
                        />
                    ) : isFirstPublish ? (
                        <Card className="gap-0 p-0">
                            <div className="text-muted-foreground px-5 py-6 text-sm leading-relaxed">
                                This will be the first published version. Every
                                question in your draft will become part of the
                                active form.
                            </div>
                        </Card>
                    ) : formVersionDiff && currentPublishedForm ? (
                        <div className="space-y-4">
                            <DiffSummary summary={formVersionDiff.summary} />
                            <DiffQuestionList
                                questionDiffs={formVersionDiff.questionDiffs}
                                fromForm={currentPublishedForm}
                                toForm={draftForm}
                                fromColumnLabel={`Version ${currentPublishedForm.version}`}
                                toColumnLabel="Your draft"
                            />
                        </div>
                    ) : null}
                </div>

                <div className="space-y-3 border-t p-4">
                    <Field data-invalid={isVersionAlreadyUsed}>
                        <FieldLabel htmlFor="publish-sheet-version">
                            Version name
                        </FieldLabel>
                        <Input
                            id="publish-sheet-version"
                            value={pendingVersion}
                            placeholder="e.g. 1.0.0"
                            autoComplete="off"
                            disabled={isPublishDraftFormForProgramPending}
                            aria-invalid={isVersionAlreadyUsed}
                            onChange={event =>
                                setPendingVersion(event.target.value)
                            }
                            onKeyDown={event => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    publish();
                                }
                            }}
                        />
                        {latestPublishedVersion !== null ? (
                            <FieldDescription>
                                Latest published version:{' '}
                                <span className="text-foreground font-medium">
                                    {latestPublishedVersion}
                                </span>
                            </FieldDescription>
                        ) : isFirstPublish ? (
                            <FieldDescription>
                                No versions have been published yet.
                            </FieldDescription>
                        ) : null}
                        {isVersionAlreadyUsed && (
                            <FieldError>
                                Version {trimmedVersion} has already been
                                published. Pick a different name.
                            </FieldError>
                        )}
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isPublishDraftFormForProgramPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={publish}
                            disabled={isPublishDisabled}
                        >
                            {isPublishDraftFormForProgramPending && (
                                <Loader2 className="animate-spin" />
                            )}
                            Publish
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
