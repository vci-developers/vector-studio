import type { z } from 'zod';
import { formSchema } from './form-schema';

export const getCurrentFormResponseSchema = formSchema;

export type GetCurrentFormResponseBody = z.infer<
    typeof getCurrentFormResponseSchema
>;
export type GetCurrentFormSuccessPayload = GetCurrentFormResponseBody;
