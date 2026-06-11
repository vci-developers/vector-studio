import { z } from 'zod';
import { locationTypeSchema } from './location-type-schema';

export const getLocationTypesByProgramIdResponseSchema = z.object({
    locationTypes: z.array(locationTypeSchema),
});

export type GetLocationTypesByProgramIdResponseBody = z.infer<
    typeof getLocationTypesByProgramIdResponseSchema
>;
export type GetLocationTypesByProgramIdSuccessPayload =
    GetLocationTypesByProgramIdResponseBody;
