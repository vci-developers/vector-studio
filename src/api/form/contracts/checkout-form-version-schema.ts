import { z } from 'zod';
import { formSchema } from './form-schema';

export const checkoutFormVersionResponseSchema = z.object({
    message: z.string(),
    form: formSchema,
});

export type CheckoutFormVersionResponseBody = z.infer<
    typeof checkoutFormVersionResponseSchema
>;
export type CheckoutFormVersionSuccessPayload = CheckoutFormVersionResponseBody;
