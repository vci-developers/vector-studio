import type { DeleteLocationTypeFromProgramResponseBody } from '@/api/location-type/contracts/delete-location-type-from-program-schema';
import type {
    PutLocationTypeByProgramIdRequestBody,
    PutLocationTypeByProgramIdResponseBody,
} from '@/api/location-type/contracts/put-location-type-by-program-id-schema';
import { deleteLocationTypeFromProgram } from '@/api/location-type/delete-location-type-from-program';
import { putLocationTypeByProgramId } from '@/api/location-type/put-location-type-by-program-id';
import { withAuthSession } from '@/lib/auth-session/with-auth-session';
import { err } from '@/lib/result/result';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{
        programId: string;
        locationTypeId: string;
    }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
    const routeParams = await params;
    const programId = Number(routeParams.programId);
    const locationTypeId = Number(routeParams.locationTypeId);

    let requestBody: PutLocationTypeByProgramIdRequestBody;
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

    const authorizedPutLocationTypeByProgramIdResult =
        await withAuthSession<PutLocationTypeByProgramIdResponseBody>(
            accessToken =>
                putLocationTypeByProgramId(
                    accessToken,
                    programId,
                    locationTypeId,
                    requestBody,
                ),
        );

    return NextResponse.json(authorizedPutLocationTypeByProgramIdResult, {
        status: authorizedPutLocationTypeByProgramIdResult.ok
            ? 200
            : (authorizedPutLocationTypeByProgramIdResult.error.status ?? 400),
    });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    const routeParams = await params;
    const programId = Number(routeParams.programId);
    const locationTypeId = Number(routeParams.locationTypeId);

    const authorizedDeleteLocationTypeFromProgramResult =
        await withAuthSession<DeleteLocationTypeFromProgramResponseBody>(
            accessToken =>
                deleteLocationTypeFromProgram(
                    accessToken,
                    programId,
                    locationTypeId,
                ),
        );

    return NextResponse.json(authorizedDeleteLocationTypeFromProgramResult, {
        status: authorizedDeleteLocationTypeFromProgramResult.ok
            ? 200
            : (authorizedDeleteLocationTypeFromProgramResult.error.status ??
              400),
    });
}
