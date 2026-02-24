'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LayoutDashboard, Users, BarChart2, ChevronRight, ShieldCheck } from 'lucide-react';

const NAV = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/usage', label: 'Usage', icon: BarChart2 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && (!user || !user.is_admin)) {
            router.replace('/dashboard');
        }
    }, [loading, user, router]);

    if (loading || !user?.is_admin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
                        <span className="text-primary-foreground font-bold text-xs">R</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Checking permissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-56 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10">
                <div className="px-5 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#1C7C54] rounded-lg flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">Admin Panel</span>
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-0.5">
                    {NAV.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active
                                        ? 'bg-[#1C7C54]/10 text-[#1C7C54]'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                {label}
                                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-gray-100">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        ← Back to App
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 ml-56 p-8">
                {children}
            </main>
        </div>
    );
}
