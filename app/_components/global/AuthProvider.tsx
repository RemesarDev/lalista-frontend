'use client';

import { useEffect } from 'react';
import { useListaStore } from '@/app/_store/store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const checkAuth = useListaStore((state) => state.checkAuth);

    useEffect(() => {
        checkAuth();
    }, []);

    return <>{children}</>;
}