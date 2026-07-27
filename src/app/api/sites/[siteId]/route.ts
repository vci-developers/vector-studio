import type {
    PutSiteRequestBody,
    PutSiteResponseBody,
} from '@/api/site/contracts/put-site-schema';
import { putSite } from '@/api/site/put-site';
import { withAuthSession } from '@/lib/auth-session/with-auth-session';
import { err } from '@/lib/result/result';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{
        siteId: string;
    }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
    const siteId = Number((await params).siteId);

    let requestBody: PutSiteRequestBody;
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

    const authorizedPutSiteResult = await withAuthSession<PutSiteResponseBody>(
        accessToken => putSite(accessToken, siteId, requestBody),
    );

    return NextResponse.json(authorizedPutSiteResult, {
        status: authorizedPutSiteResult.ok
            ? 200
            : (authorizedPutSiteResult.error.status ?? 400),
    });
}
