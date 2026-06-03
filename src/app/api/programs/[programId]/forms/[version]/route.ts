import type { GetProgramFormByVersionResponseBody } from '@/api/form/contracts/get-program-form-by-version-schema';
import { getProgramFormByVersion } from '@/api/form/get-program-form-by-version';
import { withAuthSession } from '@/lib/auth-session/with-auth-session';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{
        programId: string;
        version: string;
    }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
    const routeParams = await params;
    const programId = Number(routeParams.programId);
    const version = routeParams.version;

    const authorizedGetProgramFormByVersionResult =
        await withAuthSession<GetProgramFormByVersionResponseBody>(
            accessToken =>
                getProgramFormByVersion(accessToken, programId, version),
        );

    return NextResponse.json(authorizedGetProgramFormByVersionResult, {
        status: authorizedGetProgramFormByVersionResult.ok
            ? 200
            : (authorizedGetProgramFormByVersionResult.error.status ?? 400),
    });
}
