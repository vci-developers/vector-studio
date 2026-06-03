import { z } from 'zod';

export const deleteLocationTypeFromProgramResponseSchema = z.object({
    message: z.string(),
});

export type DeleteLocationTypeFromProgramResponseBody = z.infer<
    typeof deleteLocationTypeFromProgramResponseSchema
>;
export type DeleteLocationTypeFromProgramSuccessPayload =
    DeleteLocationTypeFromProgramResponseBody;
