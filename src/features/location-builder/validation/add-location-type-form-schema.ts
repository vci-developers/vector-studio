import { z } from 'zod';

export const addLocationTypeFormSchema = z.object({
    name: z.string().trim().min(1, 'Level name is required'),
});

export type AddLocationTypeFormInput = z.infer<
    typeof addLocationTypeFormSchema
>;
