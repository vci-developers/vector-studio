import type { GetUserProfileResponseBody } from '@/api/user/contracts/get-user-profile-schema';
import { getUserProfile } from '@/api/user/get-user-profile';
import { withAuthSession } from '@/lib/auth-session/with-auth-session';
import {
    networkErrorMessage,
    type NetworkError,
} from '@/lib/network/network-error';
import { err, ok, type Result } from '@/lib/result/result';
import { redirect } from 'next/navigation';

interface HomeLayoutProps {
    children: React.ReactNode;
}

export default async function HomeLayout({ children }: HomeLayoutProps) {
    const authorizedGetUserProfileResult =
        await withAuthSession<GetUserProfileResponseBody>(async accessToken => {
            const getUserProfileResult: Result<
                GetUserProfileResponseBody,
                NetworkError
            > = await getUserProfile(accessToken);

            if (!getUserProfileResult.ok) {
                return err(getUserProfileResult.error);
            }

            const userProfile = getUserProfileResult.data.user;
            if (!userProfile.isWhitelisted) {
                return err({
                    kind: 'forbidden',
                    status: 403,
                    message: 'User is not whitelisted',
                });
            }

            return ok(getUserProfileResult.data);
        });

    if (!authorizedGetUserProfileResult.ok) {
        if (authorizedGetUserProfileResult.error.kind === 'unauthorized') {
            redirect('/login');
        }
        if (authorizedGetUserProfileResult.error.kind === 'forbidden') {
            redirect('/forbidden');
        }
        return (
            <h1>
                ERROR:{' '}
                {networkErrorMessage(authorizedGetUserProfileResult.error)}
            </h1>
        );
    }

    const authorizedUserProfile = authorizedGetUserProfileResult.data.user;

    if (authorizedUserProfile.privilege !== 3) redirect('/forbidden');

    return <main className="flex-1 p-6">{children}</main>;
}
