'use client';

import type {
    FormQuestion,
    FormQuestionScope,
} from '@/api/form-question/contracts/form-question-schema';
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
import { simplifyPrerequisiteExpression } from '@/features/form-builder/utils/prerequisite';
import { walkQuestions } from '@/features/form-builder/utils/walk-questions';
import { Badge } from '@/components/ui/badge';

const QUESTION_FORM_ID = 'question-form';

interface QuestionFormProps {
    programId: number;
    draft: Form;
    questionBeingEdited: FormQuestion | null;
    parentIdForNewQuestion: number | null;
    answerScopeForNewQuestion: FormQuestionScope;
    onClose: () => void;
}

export default function QuestionForm({
    programId,
    draft,
    questionBeingEdited,
    parentIdForNewQuestion,
    answerScopeForNewQuestion,
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

    const isEditing = questionBeingEdited !== null;

    const answerScope = isEditing
        ? questionBeingEdited.answerScope
        : answerScopeForNewQuestion;
    const isRootQuestion = isEditing
        ? questionBeingEdited.parentId === null
        : parentIdForNewQuestion === null;
    const isSessionUnitScopedQuestion = answerScope === 'SESSION_UNIT';

    const identityRootQuestions = (draft.questions ?? []).filter(
        question =>
            question.answerScope === 'SESSION_UNIT' &&
            question.isUnitIdentityComponent,
    );

    let inheritedFollowUpIdentity = false;
    if (!isEditing && parentIdForNewQuestion !== null) {
        walkQuestions(draft.questions, question => {
            if (question.id === parentIdForNewQuestion) {
                inheritedFollowUpIdentity = question.isUnitIdentityComponent;
            }
        });
    }

    const defaultIsUnitIdentityComponent = isEditing
        ? questionBeingEdited.isUnitIdentityComponent
        : parentIdForNewQuestion !== null
          ? inheritedFollowUpIdentity
          : isSessionUnitScopedQuestion && identityRootQuestions.length === 0;
    const defaultRequired = isEditing
        ? questionBeingEdited.required
        : defaultIsUnitIdentityComponent;

    const questionForm = useForm<QuestionFormInput>({
        resolver: zodResolver(questionFormSchema),
        defaultValues: {
            label: questionBeingEdited?.label ?? '',
            type: questionBeingEdited?.type ?? 'text',
            required: defaultRequired,
            isUnitIdentityComponent: defaultIsUnitIdentityComponent,
            options: questionBeingEdited?.options ?? [],
            prerequisite: questionBeingEdited
                ? simplifyPrerequisiteExpression(
                      questionBeingEdited.prerequisite,
                  )
                : null,
        },
    });
    const selectedQuestionType = useWatch({
        control: questionForm.control,
        name: 'type',
    });
    const isUnitIdentityComponent = useWatch({
        control: questionForm.control,
        name: 'isUnitIdentityComponent',
    });

    const showIdentityToggle = isSessionUnitScopedQuestion && isRootQuestion;
    const showInheritedIdentityIndicator =
        isSessionUnitScopedQuestion &&
        !isRootQuestion &&
        isUnitIdentityComponent;

    const isRequiredLocked = isUnitIdentityComponent;
    const isIdentityRoot = showIdentityToggle && isUnitIdentityComponent;

    const otherIdentityRootCount = identityRootQuestions.filter(
        question => question.id !== questionBeingEdited?.id,
    ).length;
    const isLastIdentityRoot =
        showIdentityToggle &&
        isEditing &&
        questionBeingEdited.isUnitIdentityComponent &&
        otherIdentityRootCount === 0;

    function handleIdentityToggleChange(nextIsUnitIdentityComponent: boolean) {
        questionForm.setValue(
            'isUnitIdentityComponent',
            nextIsUnitIdentityComponent,
            { shouldValidate: true },
        );
        if (nextIsUnitIdentityComponent) {
            questionForm.setValue('required', true, { shouldValidate: true });
            questionForm.setValue('prerequisite', null);
        }
    }

    const isSubmitting =
        isCreateQuestionInDraftFormPending ||
        isUpdateQuestionInDraftFormPending;

    function onSubmit(values: QuestionFormInput) {
        const errorTitle = isEditing
            ? "Couldn't save the question"
            : "Couldn't add the question";
        const successMessage = isEditing ? 'Question saved' : 'Question added';

        const questionRequestFields = {
            label: values.label,
            type: values.type,
            required: values.required,
            isUnitIdentityComponent: values.isUnitIdentityComponent,
            options: values.type === 'select' ? values.options : null,
            prerequisite: values.prerequisite,
        };

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

        if (questionBeingEdited !== null) {
            updateQuestionInDraftForm(
                {
                    programId,
                    questionId: questionBeingEdited.id,
                    requestBody: questionRequestFields,
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
                    ...questionRequestFields,
                    parentId: parentIdForNewQuestion,
                    answerScope: answerScopeForNewQuestion,
                    order: getNextQuestionOrder(draft),
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
                        {showIdentityToggle && (
                            <Controller
                                name="isUnitIdentityComponent"
                                control={questionForm.control}
                                render={({ field }) => (
                                    <Field orientation="horizontal">
                                        <div className="flex-1">
                                            <FieldLabel htmlFor="question-form-identity">
                                                Identifies this collection
                                            </FieldLabel>
                                            <FieldDescription>
                                                {isLastIdentityRoot
                                                    ? 'This is the only identifying question. A form with per-collection catch questions needs at least one — mark another as identifying before turning this off.'
                                                    : 'Its answers — and those of its follow-ups — tell one collection batch apart from another across visits. Always shown and always required.'}
                                            </FieldDescription>
                                        </div>
                                        <Switch
                                            id="question-form-identity"
                                            checked={field.value}
                                            onCheckedChange={
                                                handleIdentityToggleChange
                                            }
                                            disabled={isLastIdentityRoot}
                                        />
                                    </Field>
                                )}
                            />
                        )}
                        {showInheritedIdentityIndicator && (
                            <Field orientation="horizontal">
                                <div className="flex-1">
                                    <FieldLabel>
                                        Part of collection identity
                                    </FieldLabel>
                                    <FieldDescription>
                                        This follow-up inherits identity from
                                        its identifying parent, so it helps tell
                                        collections apart and is always
                                        required.
                                    </FieldDescription>
                                </div>
                                <Badge variant="secondary">Identity</Badge>
                            </Field>
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
                                            {isRequiredLocked
                                                ? 'This question identifies the collection, so field workers must always answer it.'
                                                : 'Field workers cannot submit the session without answering this.'}
                                        </FieldDescription>
                                    </div>
                                    <Switch
                                        id="question-form-required"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={isRequiredLocked}
                                    />
                                </Field>
                            )}
                        />
                        {!isIdentityRoot && (
                            <Controller
                                name="prerequisite"
                                control={questionForm.control}
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>Visibility rule</FieldLabel>
                                        <FieldDescription>
                                            Hide this question unless answers to
                                            other questions match the rule
                                            below.
                                        </FieldDescription>
                                        <PrerequisiteEditor
                                            draft={draft}
                                            questionBeingEdited={
                                                questionBeingEdited
                                            }
                                            answerScope={answerScope}
                                            prerequisiteExpression={field.value}
                                            onPrerequisiteExpressionChange={
                                                field.onChange
                                            }
                                        />
                                    </Field>
                                )}
                            />
                        )}
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
