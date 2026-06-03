import { type GetLocationTypesByProgramIdResponseBody } from '@/api/location-type/contracts/get-location-types-by-program-id-schema';
import type {
    PostLocationTypeToProgramRequestBody,
    PostLocationTypeToProgramResponseBody,
} from '@/api/location-type/contracts/post-location-type-to-program-schema';
import { getLocationTypesByProgramId } from '@/api/location-type/get-location-types-by-program-id';
import { postLocationTypeToProgram } from '@/api/location-type/post-location-type-to-program';
import { withAuthSession } from '@/lib/auth-session/with-auth-session';
import { err } from '@/lib/result/result';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{
        programId: string;
    }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
    const programId = Number((await params).programId);

    const authorizedGetLocationTypesByProgramIdResult =
        await withAuthSession<GetLocationTypesByProgramIdResponseBody>(
            accessToken => getLocationTypesByProgramId(accessToken, programId),
        );

    return NextResponse.json(authorizedGetLocationTypesByProgramIdResult, {
        status: authorizedGetLocationTypesByProgramIdResult.ok
            ? 200
            : (authorizedGetLocationTypesByProgramIdResult.error.status ?? 400),
    });
}

export async function POST(request: Request, { params }: RouteParams) {
    const programId = Number((await params).programId);

    let requestBody: PostLocationTypeToProgramRequestBody;
    try {
        requestBody = await request.json();
    } catch {
        const requestBodyErrorResult = err({
            kind: 'client',
            status: 400,
            message: 'Invalid JSON body',
        });
        return NextResponse.json(requestBodyErrorResult, { status: 400 });
    }

    const authorizedPostLocationTypeToProgramResult =
        await withAuthSession<PostLocationTypeToProgramResponseBody>(
            accessToken =>
                postLocationTypeToProgram(accessToken, programId, requestBody),
        );

    return NextResponse.json(authorizedPostLocationTypeToProgramResult, {
        status: authorizedPostLocationTypeToProgramResult.ok
            ? 200
            : (authorizedPostLocationTypeToProgramResult.error.status ?? 400),
    });
}
