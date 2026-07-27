import { z } from 'zod';
import { siteSchema } from './site-schema';

export const postSiteRequestSchema = z.object({
    programId: z.number(),
    locationTypeId: z.number(),
    parentId: z.number().nullable().optional(),
    name: z.string().min(1),
    isActive: z.boolean(),
});

export const postSiteResponseSchema = z.object({
    message: z.string().optional(),
    site: siteSchema,
});

export type PostSiteRequestBody = z.infer<typeof postSiteRequestSchema>;

export type PostSiteResponseBody = z.infer<typeof postSiteResponseSchema>;
export type PostSiteSuccessPayload = PostSiteResponseBody;
