import { checkoutFormVersionForProgram } from '@/api/form/checkout-form-version-for-program';
import { type CheckoutFormVersionForProgramResponseBody } from '@/api/form/contracts/checkout-form-version-for-program-schema';
import { withAuthSession } from '@/lib/auth-session/with-auth-session';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{
        programId: string;
        version: string;
    }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
    const routeParams = await params;
    const programId = Number(routeParams.programId);
    const version = routeParams.version;

    const authorizedCheckoutFormVersionForProgramResult =
        await withAuthSession<CheckoutFormVersionForProgramResponseBody>(
            accessToken =>
                checkoutFormVersionForProgram(accessToken, programId, version),
        );

    return NextResponse.json(authorizedCheckoutFormVersionForProgramResult, {
        status: authorizedCheckoutFormVersionForProgramResult.ok
            ? 200
            : (authorizedCheckoutFormVersionForProgramResult.error.status ??
              400),
    });
}
