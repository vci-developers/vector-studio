import type {
    PublishDraftFormForProgramResponseBody,
    PublishDraftFormForProgramRequestBody,
} from '@/api/form/contracts/publish-draft-form-for-program-schema';
import { publishDraftFormForProgram } from '@/api/form/publish-draft-form-for-program';
import { withAuthSession } from '@/lib/auth-session/with-auth-session';
import { err } from '@/lib/result/result';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{
        programId: string;
    }>;
}

export async function POST(request: Request, { params }: RouteParams) {
    const programId = Number((await params).programId);

    let requestBody: PublishDraftFormForProgramRequestBody;
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

    const authorizedPublishDraftFormForProgramResult =
        await withAuthSession<PublishDraftFormForProgramResponseBody>(
            accessToken =>
                publishDraftFormForProgram(accessToken, programId, requestBody),
        );

    return NextResponse.json(authorizedPublishDraftFormForProgramResult, {
        status: authorizedPublishDraftFormForProgramResult.ok
            ? 200
            : (authorizedPublishDraftFormForProgramResult.error.status ?? 400),
    });
}
