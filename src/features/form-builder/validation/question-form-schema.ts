import { z } from 'zod';

export const questionFormSchema = z
    .object({
        label: z.string().trim().min(1, 'Question text is required'),
        type: z.enum(['text', 'number', 'boolean', 'select', 'date']),
        required: z.boolean(),
        options: z.array(z.string().trim().min(1, 'Option text is required')),
    })
    .refine(data => data.type !== 'select' || data.options.length > 0, {
        path: ['options'],
        message: 'Add at least one option for a dropdown question.',
    });

export type QuestionFormInput = z.infer<typeof questionFormSchema>;
