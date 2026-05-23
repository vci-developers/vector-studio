'use client';

import { useGetFormsByProgramId } from "@/api/form/hooks/use-get-forms-by-program-id";
import { usePublishDraftFormForProgram } from "@/api/form/hooks/use-publish-draft-form-for-program";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { networkErrorMessage } from "@/lib/network/network-error";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const DRAFT_VERSION_TOKEN = '';

interface PublishDialogProps {
    isOpen: boolean;
    programId: number;
    onClose: () => void;
}

export default function PublishDialog({
    isOpen,
    programId,
    onClose,
}: PublishDialogProps) {
    const router = useRouter();
    const [pendingVersion, setPendingVersion] = useState('');

    const { data: getFormsByProgramIdResult } =
        useGetFormsByProgramId(programId);
    const {
        mutate: publishDraftFormForProgram,
        isPending: isPublishDraftFormForProgramPending,
    } = usePublishDraftFormForProgram();

    const publishedForms = getFormsByProgramIdResult?.ok
        ? getFormsByProgramIdResult.data.forms
              .filter(form => form.version !== DRAFT_VERSION_TOKEN)
              .sort((a, b) => b.createdAt - a.createdAt)
        : null;
    const latestPublishedVersion = publishedForms?.[0]?.version ?? null;
    const publishedVersions = new Set(
        publishedForms?.map(form => form.version) ?? [],
    );

    const trimmedVersion = pendingVersion.trim();
    const isVersionEmpty = trimmedVersion.length === 0;
    const isVersionAlreadyUsed =
        publishedForms !== null && publishedVersions.has(trimmedVersion);
    const isPublishDisabled =
        isVersionEmpty ||
        isVersionAlreadyUsed ||
        isPublishDraftFormForProgramPending;
    
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
        <Dialog
            open={isOpen}
            onOpenChange={open => {
                if (!open) onClose();
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Publish draft as a new version</DialogTitle>
                    <DialogDescription>
                        Name this version and make it the active form for your
                        program. Publishing creates a new immutable version;
                        your draft stays where it is.
                    </DialogDescription>
                </DialogHeader>
                <Field data-invalid={isVersionAlreadyUsed}>
                    <FieldLabel htmlFor="publish-dialog-version">
                        Version name
                    </FieldLabel>
                    <Input
                        id="publish-dialog-version"
                        value={pendingVersion}
                        placeholder="e.g. v1.0.7"
                        autoFocus
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
                    ) : publishedForms !== null ? (
                        <FieldDescription>
                            No versions have been published yet.
                        </FieldDescription>
                    ) : null}
                    {isVersionAlreadyUsed && (
                        <FieldError>
                            Version {trimmedVersion} has already been published.
                            Pick a different name.
                        </FieldError>
                    )}
                </Field>
                <DialogFooter>
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
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
