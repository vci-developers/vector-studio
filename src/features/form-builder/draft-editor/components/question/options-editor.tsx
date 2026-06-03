'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface OptionsEditorProps {
    value: string[];
    onChange: (value: string[]) => void;
}

export default function OptionsEditor({ value, onChange }: OptionsEditorProps) {
    const [draftOption, setDraftOption] = useState('');

    function addOption() {
        const trimmed = draftOption.trim();
        if (trimmed.length === 0) return;
        onChange([...value, trimmed]);
        setDraftOption('');
    }

    function updateOption(index: number, next: string) {
        const updated = value.slice();
        updated[index] = next;
        onChange(updated);
    }

    function removeOption(index: number) {
        onChange(value.filter((_, i) => i !== index));
    }

    function moveOption(index: number, direction: 'up' | 'down') {
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= value.length) return;
        const updated = value.slice();
        const moved = updated[index];
        const partner = updated[swapIndex];
        if (moved === undefined || partner === undefined) return;
        updated[index] = partner;
        updated[swapIndex] = moved;
        onChange(updated);
    }

    return (
        <div className="space-y-2">
            {value.length > 0 && (
                <ul className="border-border divide-border divide-y overflow-hidden rounded-md border">
                    {value.map((option, index) => (
                        <li
                            key={index}
                            className="flex items-center gap-2 px-2 py-1.5"
                        >
                            <div className="flex flex-col">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() =>
                                                moveOption(index, 'up')
                                            }
                                            disabled={index === 0}
                                            aria-label="Move option up"
                                        >
                                            <ArrowUp />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Move up</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() =>
                                                moveOption(index, 'down')
                                            }
                                            disabled={
                                                index === value.length - 1
                                            }
                                            aria-label="Move option down"
                                        >
                                            <ArrowDown />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Move down</TooltipContent>
                                </Tooltip>
                            </div>
                            <Input
                                value={option}
                                onChange={event =>
                                    updateOption(index, event.target.value)
                                }
                                aria-label={`Option ${index + 1}`}
                                className="h-8 flex-1"
                            />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => removeOption(index)}
                                        aria-label={`Remove option ${index + 1}`}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remove</TooltipContent>
                            </Tooltip>
                        </li>
                    ))}
                </ul>
            )}
            <div className="flex items-center gap-2">
                <Input
                    value={draftOption}
                    onChange={event => setDraftOption(event.target.value)}
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            addOption();
                        }
                    }}
                    placeholder="Add an option"
                    className="h-8 flex-1"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    disabled={draftOption.trim().length === 0}
                >
                    <Plus />
                    Add
                </Button>
            </div>
        </div>
    );
}
