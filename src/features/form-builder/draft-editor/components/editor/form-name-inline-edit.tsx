'use client';

import type { Form } from '@/api/form/contracts/form-schema';
import { usePutDraftFormByProgramId } from '@/api/form/hooks/use-put-draft-form-by-program-id';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { networkErrorMessage } from '@/lib/network/network-error';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface FormNameInlineEditProps {
    programId: number;
    draft: Form;
}

export default function FormNameInlineEdit({
    programId,
    draft,
}: FormNameInlineEditProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [pendingName, setPendingName] = useState(draft.name);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        mutate: updateDraftFormByProgramId,
        isPending: isUpdateDraftFormByProgramIdPending,
    } = usePutDraftFormByProgramId();

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    function startEditing() {
        setPendingName(draft.name);
        setIsEditing(true);
    }

    function cancelEditing() {
        setPendingName(draft.name);
        setIsEditing(false);
    }

    function commit() {
        const trimmedName = pendingName.trim();
        if (trimmedName.length === 0 || trimmedName === draft.name) {
            cancelEditing();
            return;
        }
        updateDraftFormByProgramId(
            {
                programId,
                requestBody: { name: trimmedName },
            },
            {
                onSuccess: result => {
                    if (!result.ok) {
                        toast.error("Couldn't rename the draft", {
                            description: networkErrorMessage(result.error),
                        });
                        return;
                    }
                    setIsEditing(false);
                },
                onError: () => {
                    toast.error("Couldn't rename the draft", {
                        description:
                            'A network error occurred. Please try again.',
                    });
                },
            },
        );
    }

    if (!isEditing) {
        return (
            <button
                type="button"
                onClick={startEditing}
                className="group hover:bg-muted/50 focus-visible:outline-ring/60 -mx-1 flex items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-label="Rename form"
            >
                <span className="text-xl font-semibold tracking-tight">
                    {draft.name}
                </span>
                <Pencil className="text-muted-foreground/60 group-hover:text-muted-foreground size-3.5 transition-colors" />
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Input
                ref={inputRef}
                value={pendingName}
                onChange={event => setPendingName(event.target.value)}
                onKeyDown={event => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        commit();
                    } else if (event.key === 'Escape') {
                        event.preventDefault();
                        cancelEditing();
                    }
                }}
                disabled={isUpdateDraftFormByProgramIdPending}
                className="h-9 text-lg font-semibold"
                aria-label="Form name"
            />
            <Button
                type="button"
                variant="default"
                size="icon-sm"
                onClick={commit}
                disabled={
                    isUpdateDraftFormByProgramIdPending ||
                    pendingName.trim().length === 0
                }
                aria-label="Save name"
            >
                {isUpdateDraftFormByProgramIdPending ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <Check />
                )}
            </Button>
            <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={cancelEditing}
                disabled={isUpdateDraftFormByProgramIdPending}
                aria-label="Cancel rename"
            >
                <X />
            </Button>
        </div>
    );
}
