'use client';

import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import { usePostQuestionToDraftForm } from '@/api/form-question/hooks/use-post-question-to-draft-form';
import { usePutQuestionToDraftForm } from '@/api/form-question/hooks/use-put-question-to-draft-form';
import type { Form } from '@/api/form/contracts/form-schema';
import {
    questionFormSchema,
    type QuestionFormInput,
} from '../../validation/question-form-schema';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Fragment } from 'react';
import { getNextQuestionOrder } from '../../utils/question-order';
import { toast } from 'sonner';
import {
    networkErrorMessage,
    type NetworkError,
} from '@/lib/network/network-error';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import OptionsEditor from './options-editor';
import PrerequisiteEditor from '../prerequisite/prerequisite-editor';
import { QUESTION_TYPE_LABELS } from '@/features/form-builder/utils/question-type-labels';
import type { Result } from '@/lib/result/result';

const QUESTION_FORM_ID = 'question-form';

interface QuestionFormProps {
    programId: number;
    draft: Form;
    questionBeingEdited: FormQuestion | null;
    parentIdForNewQuestion: number | null;
    onClose: () => void;
}

export default function QuestionForm({
    programId,
    draft,
    questionBeingEdited,
    parentIdForNewQuestion,
    onClose,
}: QuestionFormProps) {
    const {
        mutate: createQuestionInDraftForm,
        isPending: isCreateQuestionInDraftFormPending,
    } = usePostQuestionToDraftForm();
    const {
        mutate: updateQuestionInDraftForm,
        isPending: isUpdateQuestionInDraftFormPending,
    } = usePutQuestionToDraftForm();

    const questionForm = useForm<QuestionFormInput>({
        resolver: zodResolver(questionFormSchema),
        defaultValues: questionBeingEdited
            ? {
                  label: questionBeingEdited.label,
                  type: questionBeingEdited.type,
                  required: questionBeingEdited.required,
                  options: questionBeingEdited.options ?? [],
                  prerequisite: questionBeingEdited.prerequisite,
              }
            : {
                  label: '',
                  type: 'text',
                  required: false,
                  options: [],
                  prerequisite: null,
              },
    });
    const selectedQuestionType = useWatch({
        control: questionForm.control,
        name: 'type',
    });

    const isSubmitting =
        isCreateQuestionInDraftFormPending ||
        isUpdateQuestionInDraftFormPending;

    function onSubmit(values: QuestionFormInput) {
        const isEditing = questionBeingEdited !== null;
        const errorTitle = isEditing
            ? "Couldn't save the question"
            : "Couldn't add the question";
        const successMessage = isEditing ? 'Question saved' : 'Question added';
        const normalizedOptions =
            values.type === 'select' ? values.options : null;

        function handleMutationResult(result: Result<unknown, NetworkError>) {
            if (!result.ok) {
                toast.error(errorTitle, {
                    description: networkErrorMessage(result.error),
                });
                return;
            }
            toast.success(successMessage);
            onClose();
        }

        function handleNetworkError() {
            toast.error(errorTitle, {
                description: 'A network error occurred. Please try again.',
            });
        }

        if (isEditing) {
            updateQuestionInDraftForm(
                {
                    programId,
                    questionId: questionBeingEdited.id,
                    requestBody: {
                        label: values.label,
                        type: values.type,
                        required: values.required,
                        options: normalizedOptions,
                        prerequisite: values.prerequisite,
                    },
                },
                {
                    onSuccess: handleMutationResult,
                    onError: handleNetworkError,
                },
            );
            return;
        }

        createQuestionInDraftForm(
            {
                programId,
                requestBody: {
                    label: values.label,
                    type: values.type,
                    required: values.required,
                    parentId: parentIdForNewQuestion,
                    options: normalizedOptions,
                    order: getNextQuestionOrder(draft),
                    prerequisite: values.prerequisite,
                },
            },
            { onSuccess: handleMutationResult, onError: handleNetworkError },
        );
    }

    return (
        <Fragment>
            <div className="flex-1 overflow-y-auto px-6 py-5">
                <form
                    id={QUESTION_FORM_ID}
                    onSubmit={questionForm.handleSubmit(onSubmit)}
                >
                    <FieldGroup>
                        <Controller
                            name="label"
                            control={questionForm.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="question-form-label">
                                        Question text
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id="question-form-label"
                                        placeholder="e.g. Where was the household sprayed?"
                                        aria-invalid={fieldState.invalid}
                                        autoComplete="off"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    )}
                                </Field>
                            )}
                        />
                        <Controller
                            name="type"
                            control={questionForm.control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel htmlFor="question-form-type">
                                        Answer type
                                    </FieldLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger
                                            id="question-form-type"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(
                                                QUESTION_TYPE_LABELS,
                                            ).map(([value, label]) => (
                                                <SelectItem
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FieldDescription>
                                        Field workers will see an input shaped
                                        for this type.
                                    </FieldDescription>
                                </Field>
                            )}
                        />
                        {selectedQuestionType === 'select' && (
                            <Controller
                                name="options"
                                control={questionForm.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>
                                            Dropdown options
                                        </FieldLabel>
                                        <OptionsEditor
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />
                        )}
                        <Controller
                            name="required"
                            control={questionForm.control}
                            render={({ field }) => (
                                <Field orientation="horizontal">
                                    <div className="flex-1">
                                        <FieldLabel htmlFor="question-form-required">
                                            Required
                                        </FieldLabel>
                                        <FieldDescription>
                                            Field workers cannot submit the
                                            session without answering this.
                                        </FieldDescription>
                                    </div>
                                    <Switch
                                        id="question-form-required"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </Field>
                            )}
                        />
                        <Controller
                            name="prerequisite"
                            control={questionForm.control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel>Visibility rule</FieldLabel>
                                    <FieldDescription>
                                        Hide this question unless answers to
                                        other questions match the rule below.
                                    </FieldDescription>
                                    <PrerequisiteEditor
                                        draft={draft}
                                        questionBeingEdited={
                                            questionBeingEdited
                                        }
                                        prerequisiteExpression={field.value}
                                        onPrerequisiteExpressionChange={
                                            field.onChange
                                        }
                                    />
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </form>
            </div>
            <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    form={QUESTION_FORM_ID}
                    disabled={isSubmitting}
                >
                    {isSubmitting && <Loader2 className="animate-spin" />}
                    {questionBeingEdited ? 'Save changes' : 'Add question'}
                </Button>
            </SheetFooter>
        </Fragment>
    );
}
