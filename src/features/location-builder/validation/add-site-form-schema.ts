import { z } from 'zod';

export const addSiteFormSchema = z.object({
    name: z.string().trim().min(1, 'Site name is required'),
});

export type AddSiteFormInput = z.infer<typeof addSiteFormSchema>;
