import { z } from 'zod';
import { locationTypeSchema } from './location-type-schema';

export const putLocationTypeByProgramIdRequestSchema = z
    .object({
        name: z.string().min(1),
        level: z.number(),
    })
    .partial();

export const putLocationTypeByProgramIdResponseSchema = z.object({
    message: z.string(),
    locationType: locationTypeSchema,
});

export type PutLocationTypeByProgramIdRequestBody = z.infer<
    typeof putLocationTypeByProgramIdRequestSchema
>;

export type PutLocationTypeByProgramIdResponseBody = z.infer<
    typeof putLocationTypeByProgramIdResponseSchema
>;
export type PutLocationTypeByProgramIdSuccessPayload =
    PutLocationTypeByProgramIdResponseBody;
