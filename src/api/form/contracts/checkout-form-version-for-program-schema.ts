import { z } from 'zod';
import { formSchema } from './form-schema';

export const checkoutFormVersionForProgramResponseSchema = z.object({
    message: z.string(),
    form: formSchema,
});

export type CheckoutFormVersionForProgramResponseBody = z.infer<
    typeof checkoutFormVersionForProgramResponseSchema
>;
export type CheckoutFormVersionForProgramSuccessPayload =
    CheckoutFormVersionForProgramResponseBody;
