import { z } from 'zod';
import { locationTypeSchema } from './location-type-schema';

export const postLocationTypeToProgramRequestSchema = z.object({
    name: z.string().min(1),
    level: z.number(),
});

export const postLocationTypeToProgramResponseSchema = z.object({
    message: z.string(),
    locationType: locationTypeSchema,
});

export type PostLocationTypeToProgramRequestBody = z.infer<
    typeof postLocationTypeToProgramRequestSchema
>;

export type PostLocationTypeToProgramResponseBody = z.infer<
    typeof postLocationTypeToProgramResponseSchema
>;
export type PostLocationTypeToProgramSuccessPayload =
    PostLocationTypeToProgramResponseBody;
