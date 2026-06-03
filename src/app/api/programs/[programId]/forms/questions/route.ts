import type {
    PostQuestionToDraftFormRequestBody,
    PostQuestionToDraftFormResponseBody,
} from '@/api/form-question/contracts/post-question-to-draft-form-schema';
import { postQuestionToDraftForm } from '@/api/form-question/post-question-to-draft-form';
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

    let requestBody: PostQuestionToDraftFormRequestBody;
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

    const authorizedPostQuestionToDraftFormResult =
        await withAuthSession<PostQuestionToDraftFormResponseBody>(
            accessToken =>
                postQuestionToDraftForm(accessToken, programId, requestBody),
        );

    return NextResponse.json(authorizedPostQuestionToDraftFormResult, {
        status: authorizedPostQuestionToDraftFormResult.ok
            ? 200
            : (authorizedPostQuestionToDraftFormResult.error.status ?? 400),
    });
}
