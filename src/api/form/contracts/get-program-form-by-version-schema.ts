import type { z } from 'zod';
import { formSchema } from './form-schema';

export const getProgramFormByVersionResponseSchema = formSchema;

export type GetProgramFormByVersionResponseBody = z.infer<
    typeof getProgramFormByVersionResponseSchema
>;
export type GetProgramFormByVersionSuccessPayload =
    GetProgramFormByVersionResponseBody;
