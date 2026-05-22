import { type GetFormsByProgramIdResponseBody } from '@/api/form/contracts/get-forms-by-program-id-schema';
import type {
    PutDraftFormByProgramIdResponseBody,
    PutDraftFormByProgramIdRequestBody,
} from '@/api/form/contracts/put-draft-form-by-program-id-schema';
import { getFormsByProgramId } from '@/api/form/get-forms-by-program-id';
import { putDraftFormByProgramId } from '@/api/form/put-draft-form-by-program-id';
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

    const authorizedGetFormsByProgramIdResult =
        await withAuthSession<GetFormsByProgramIdResponseBody>(accessToken =>
            getFormsByProgramId(accessToken, programId),
        );

    return NextResponse.json(authorizedGetFormsByProgramIdResult, {
        status: authorizedGetFormsByProgramIdResult.ok
            ? 200
            : (authorizedGetFormsByProgramIdResult.error.status ?? 400),
    });
}

export async function PUT(request: Request, { params }: RouteParams) {
    const programId = Number((await params).programId);

    let requestBody: PutDraftFormByProgramIdRequestBody;
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

    const authorizedPutDraftFormByProgramIdResult =
        await withAuthSession<PutDraftFormByProgramIdResponseBody>(
            accessToken =>
                putDraftFormByProgramId(accessToken, programId, requestBody),
        );

    return NextResponse.json(authorizedPutDraftFormByProgramIdResult, {
        status: authorizedPutDraftFormByProgramIdResult.ok
            ? 200
            : (authorizedPutDraftFormByProgramIdResult.error.status ?? 400),
    });
}
