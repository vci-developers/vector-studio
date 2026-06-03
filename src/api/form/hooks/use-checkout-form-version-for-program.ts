import type { Result } from '@/lib/result/result';
import type { CheckoutFormVersionForProgramSuccessPayload } from '../contracts/checkout-form-version-for-program-schema';
import type { NetworkError } from '@/lib/network/network-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formKeys } from '../form-keys';

type CheckoutFormVersionForProgramVariables = {
    programId: number;
    version: string;
};

type CheckoutFormVersionForProgramMutationResult = Result<
    CheckoutFormVersionForProgramSuccessPayload,
    NetworkError
>;

async function checkoutFormVersionForProgram({
    programId,
    version,
}: CheckoutFormVersionForProgramVariables): Promise<CheckoutFormVersionForProgramMutationResult> {
    const response = await fetch(
        `/api/programs/${programId}/forms/${version}/checkout`,
        {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        },
    );

    const checkoutFormVersionForProgramResult: CheckoutFormVersionForProgramMutationResult =
        await response.json();
    return checkoutFormVersionForProgramResult;
}

export function useCheckoutFormVersionForProgram() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: checkoutFormVersionForProgram,
        onSuccess: (data, variables) => {
            if (data.ok) {
                queryClient.invalidateQueries({
                    queryKey: formKeys.draftByProgramId(variables.programId),
                });
            }
        },
    });
}
