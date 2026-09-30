// app/admin/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useListaStore } from '@/app/_store/store';
import { ChartLine, Database, Envelope, House } from '@phosphor-icons/react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loadingAuth, checkAuth } = useListaStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!loadingAuth) {
            if (!user || user.role !== 'admin') {
                router.replace('/');
            }
        }
    }, [user, loadingAuth, router]);

    if (loadingAuth) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500 text-sm">
                Verificando credenciales de acceso...
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return null;
    }

    const navItems = [
        { label: 'Métricas', href: '/admin/metrics', icon: ChartLine },
        { label: 'Backups', href: '/admin/backup', icon: Database },
        { label: 'Mensajes', href: '/admin/mensajes', icon: Envelope },
    ];

    return (
        <div className="flex min-h-screen bg-slate-100 text-slate-900">
            {/* Sidebar del Admin */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-6">
                <div>
                    <div className="flex items-center gap-3 px-2 mb-8">
                        <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                            L
                        </div>
                        <div>
                            <h1 className="text-sm font-bold tracking-tight">LALIsta Admin</h1>
                            <p className="text-[11px] text-slate-400">Panel de Control</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition ${
                                        isActive
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                    >
                        <House size={18} />
                        Volver al sitio
                    </Link>
                </div>
            </aside>

            {/* Contenido */}
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto">{children}</div>
            </main>
        </div>
    );
}