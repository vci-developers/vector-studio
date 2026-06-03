import LogoutButton from '@/components/auth-session/logout-button';
import Link from 'next/link';
import { Fragment } from 'react';

export default function Home() {
    return (
        <Fragment>
            <Link href="/forms">Form Builder</Link>
            <LogoutButton />
        </Fragment>
    );
}
