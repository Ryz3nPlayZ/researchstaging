'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Signup is handled via Google OAuth on the login page.
export default function SignupPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/login');
    }, [router]);
    return null;
}
