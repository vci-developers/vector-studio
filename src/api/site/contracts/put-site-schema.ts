import { z } from 'zod';
import { siteSchema } from './site-schema';

export const putSiteRequestSchema = z
    .object({
        name: z.string().min(1),
        isActive: z.boolean(),
    })
    .partial();

export const putSiteResponseSchema = z.object({
    message: z.string().optional(),
    site: siteSchema,
});

export type PutSiteRequestBody = z.infer<typeof putSiteRequestSchema>;

export type PutSiteResponseBody = z.infer<typeof putSiteResponseSchema>;
export type PutSiteSuccessPayload = PutSiteResponseBody;
