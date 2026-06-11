import { z } from 'zod';

export const addLocationLevelFormSchema = z.object({
    name: z.string().trim().min(1, 'Level name is required'),
});

export type AddLocationLevelFormInput = z.infer<
    typeof addLocationLevelFormSchema
>;
