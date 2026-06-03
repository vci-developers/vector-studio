import z from 'zod';
import { formSchema } from './form-schema';

export const getFormsByProgramIdResponseSchema = z.object({
    forms: z.array(formSchema),
});

export type GetFormsByProgramIdResponseBody = z.infer<
    typeof getFormsByProgramIdResponseSchema
>;
export type GetFormsByProgramIdSuccessPayload = GetFormsByProgramIdResponseBody;
