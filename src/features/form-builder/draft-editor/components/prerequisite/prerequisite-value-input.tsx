'use client';

import type { FormQuestion } from '@/api/form-question/contracts/form-question-schema';
import type {
    PrerequisiteOperator,
    PrerequisiteValue,
} from '@/api/form-question/contracts/prerequisite-expression-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Check } from 'lucide-react';

interface PrerequisiteValueInputProps {
    referencedQuestion: FormQuestion;
    operator: PrerequisiteOperator;
    predicateValue: PrerequisiteValue | undefined;
    onPredicateValueChange: (
        nextPredicateValue: PrerequisiteValue | undefined,
    ) => void;
}

export default function PrerequisiteValueInput({
    referencedQuestion,
    operator,
    predicateValue,
    onPredicateValueChange,
}: PrerequisiteValueInputProps) {
    if (operator === 'empty' || operator === 'not_empty') {
        return null;
    }

    if (operator === 'in' || operator === 'not_in') {
        const selectedOptions: string[] = Array.isArray(predicateValue)
            ? predicateValue.flatMap(entry =>
                  typeof entry === 'string' ? [entry] : [],
              )
            : [];
        const availableOptions = referencedQuestion.options ?? [];

        if (availableOptions.length === 0) {
            return (
                <span className="text-muted-foreground self-center text-xs">
                    No options on the referenced question.
                </span>
            );
        }

        function toggleSelectedOption(option: string) {
            const isCurrentlySelected = selectedOptions.includes(option);
            const nextSelectedOptions = isCurrentlySelected
                ? selectedOptions.filter(selected => selected !== option)
                : [...selectedOptions, option];
            onPredicateValueChange(nextSelectedOptions);
        }

        return (
            <div className="flex flex-wrap gap-1.5">
                {availableOptions.map(option => {
                    const isOptionSelected = selectedOptions.includes(option);
                    return (
                        <Button
                            key={option}
                            type="button"
                            variant={isOptionSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleSelectedOption(option)}
                        >
                            {isOptionSelected && <Check />}
                            {option}
                        </Button>
                    );
                })}
            </div>
        );
    }

    switch (referencedQuestion.type) {
        case 'boolean': {
            const booleanValue =
                typeof predicateValue === 'boolean' ? predicateValue : true;
            return (
                <Select
                    value={booleanValue ? 'true' : 'false'}
                    onValueChange={nextBooleanValue =>
                        onPredicateValueChange(nextBooleanValue === 'true')
                    }
                >
                    <SelectTrigger size="sm" className="min-w-24">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                </Select>
            );
        }
        case 'select': {
            const selectedOption =
                typeof predicateValue === 'string' ? predicateValue : '';
            const availableOptions = referencedQuestion.options ?? [];
            return (
                <Select
                    value={selectedOption}
                    onValueChange={nextSelectedOption =>
                        onPredicateValueChange(nextSelectedOption)
                    }
                >
                    <SelectTrigger size="sm" className="min-w-32">
                        <SelectValue placeholder="Pick an option" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableOptions.map(option => (
                            <SelectItem key={option} value={option}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }
        case 'number': {
            const numericValue =
                typeof predicateValue === 'number' ? predicateValue : 0;
            return (
                <Input
                    type="number"
                    value={String(numericValue)}
                    onChange={event => {
                        const parsedNumericValue = Number(event.target.value);
                        onPredicateValueChange(
                            Number.isNaN(parsedNumericValue)
                                ? 0
                                : parsedNumericValue,
                        );
                    }}
                    className="h-8 w-28"
                    aria-label="Value"
                />
            );
        }
        case 'date': {
            const isoDateValue =
                typeof predicateValue === 'string' ? predicateValue : '';
            return (
                <Input
                    type="date"
                    value={isoDateValue}
                    onChange={event =>
                        onPredicateValueChange(event.target.value)
                    }
                    className="h-8 w-40"
                    aria-label="Value"
                />
            );
        }
        case 'text': {
            const textValue =
                typeof predicateValue === 'string' ? predicateValue : '';
            return (
                <Input
                    type="text"
                    value={textValue}
                    onChange={event =>
                        onPredicateValueChange(event.target.value)
                    }
                    placeholder="Value"
                    className="h-8 w-40"
                    aria-label="Value"
                />
            );
        }
    }
}
