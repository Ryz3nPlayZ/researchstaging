'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserInitials } from '@/lib/auth';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function TopBar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    const navItems = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Projects', href: '/projects' },
    ];

    const initials = getUserInitials(user?.name) || 'U';

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-black/[0.04]">
            <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-[#1B512D] text-[#DEF4C6] flex items-center justify-center shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" opacity="0.4" />
                                <circle cx="12" cy="12" r="3" fill="currentColor" />
                                <path d="M12 2L12 22M2 12L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span className="font-ui text-[18px] font-bold tracking-tight text-[#1B512D]">
                            Hellycopter
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1 pl-3">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'font-ui text-[13px] font-medium px-3 py-1.5 rounded-full transition-colors',
                                        isActive
                                            ? 'bg-[#DEF4C6] text-[#1C7C54]'
                                            : 'text-[#4A5D4A] hover:bg-[#F5F5F7] hover:text-[#1B512D]'
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-full bg-[#F5F5F7] border border-black/[0.04] min-w-[220px]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8A9A8A]">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <span className="text-xs text-[#8A9A8A]">Search</span>
                    </div>

                    <button
                        type="button"
                        className="h-9 w-9 rounded-full bg-[#F5F5F7] border border-black/[0.04] flex items-center justify-center text-[#4A5D4A] hover:text-[#1B512D]"
                        aria-label="Notifications"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                            <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .738-1.674C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
                        </svg>
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 outline-none rounded-full transition-opacity hover:opacity-85">
                                <div className="h-9 w-9 rounded-full bg-[#DEF4C6] flex items-center justify-center border border-[#73E2A7]/40">
                                    <span className="font-ui text-[11px] font-bold text-[#1C7C54]">
                                        {initials}
                                    </span>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {user?.name && (
                                <>
                                    <div className="px-2 py-1.5">
                                        <p className="font-ui text-sm font-medium text-base-800">{user.name}</p>
                                        <p className="font-ui text-xs text-base-400">{user.email}</p>
                                    </div>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem className="font-ui text-xs" asChild>
                                <Link href="/settings">Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="font-ui text-xs text-error" onClick={handleLogout}>
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Link
                        href="/projects"
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#73E2A7] hover:bg-[#1C7C54] text-white text-xs font-semibold transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14" />
                            <path d="M5 12h14" />
                        </svg>
                        New
                    </Link>
                </div>
            </div>
        </header>
    );
}
