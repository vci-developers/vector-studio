import type {
    PostSiteRequestBody,
    PostSiteResponseBody,
} from '@/api/site/contracts/post-site-schema';
import { postSite } from '@/api/site/post-site';
import { withAuthSession } from '@/lib/auth-session/with-auth-session';
import { err } from '@/lib/result/result';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    let requestBody: PostSiteRequestBody;
    try {
        requestBody = await request.json();
    } catch {
        const requestBodyErrorResult = err({
            kind: 'client',
            status: 400,
            message: 'Invalid JSON body',
        });
        return NextResponse.json(requestBodyErrorResult, {
            status: 400,
        });
    }

    const authorizedPostSiteResult =
        await withAuthSession<PostSiteResponseBody>(accessToken =>
            postSite(accessToken, requestBody),
        );

    return NextResponse.json(authorizedPostSiteResult, {
        status: authorizedPostSiteResult.ok
            ? 200
            : (authorizedPostSiteResult.error.status ?? 400),
    });
}
