import type { DeleteQuestionFromDraftFormResponseBody } from '@/api/form-question/contracts/delete-question-from-draft-form-schema';
import type {
    PutQuestionToDraftFormRequestBody,
    PutQuestionToDraftFormResponseBody,
} from '@/api/form-question/contracts/put-question-to-draft-form-schema';
import { deleteQuestionFromDraftForm } from '@/api/form-question/delete-question-from-draft-form';
import { putQuestionToDraftForm } from '@/api/form-question/put-question-to-draft-form';
import { withAuthSession } from '@/lib/auth-session/with-auth-session';
import { err } from '@/lib/result/result';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{
        programId: string;
        questionId: string;
    }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
    const routeParams = await params;
    const programId = Number(routeParams.programId);
    const questionId = Number(routeParams.questionId);

    let requestBody: PutQuestionToDraftFormRequestBody;
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

    const authorizedPutQuestionToDraftFormResult =
        await withAuthSession<PutQuestionToDraftFormResponseBody>(accessToken =>
            putQuestionToDraftForm(
                accessToken,
                programId,
                questionId,
                requestBody,
            ),
        );

    return NextResponse.json(authorizedPutQuestionToDraftFormResult, {
        status: authorizedPutQuestionToDraftFormResult.ok
            ? 200
            : (authorizedPutQuestionToDraftFormResult.error.status ?? 400),
    });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    const routeParams = await params;
    const programId = Number(routeParams.programId);
    const questionId = Number(routeParams.questionId);

    const authorizedDeleteQuestionFromDraftFormResult =
        await withAuthSession<DeleteQuestionFromDraftFormResponseBody>(
            accessToken =>
                deleteQuestionFromDraftForm(accessToken, programId, questionId),
        );

    return NextResponse.json(authorizedDeleteQuestionFromDraftFormResult, {
        status: authorizedDeleteQuestionFromDraftFormResult.ok
            ? 200
            : (authorizedDeleteQuestionFromDraftFormResult.error.status ?? 400),
    });
}
