'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { CommandMenu } from './command-menu';
import { Search } from 'lucide-react';

export function TopBar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [commandOpen, setCommandOpen] = useState(false);

    const navItems = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Projects', href: '/projects' },
        { label: 'Literature', href: '/literature' },
    ];

    const initials = getUserInitials(user?.name) || 'U';

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="flex-none h-14 z-50 flex items-center justify-between px-4 fixed top-3 left-4 right-4">
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-black/[0.04]" />
            <div className="flex items-center gap-3 h-full relative z-10">
                <Link href="/dashboard" className="flex items-center gap-2 group">
                    <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" opacity="0.4" />
                            <circle cx="12" cy="12" r="3" fill="currentColor" />
                            <path d="M12 2L12 22M2 12L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                </Link>

                <div className="w-px h-4 bg-gray-200/80 hidden md:block" />

                <nav className="hidden md:flex items-center gap-1 h-full">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'font-ui text-[13px] font-medium px-3 py-1.5 rounded-lg transition-all relative flex items-center',
                                    isActive
                                        ? 'text-gray-900 bg-white shadow-sm border border-black/[0.04]'
                                        : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'
                                )}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="flex items-center gap-2 relative z-10">
                {/* Search — direct button that instantly opens command menu */}
                <button
                    onClick={() => setCommandOpen(true)}
                    className="h-8 flex items-center gap-2 px-3 rounded-lg bg-white/80 hover:bg-white border border-black/[0.04] hover:border-gray-200 transition-all cursor-pointer shadow-sm"
                >
                    <Search size={12} className="text-gray-400" />
                    <span className="text-[12px] text-gray-400 hidden sm:inline">Search</span>
                    <div className="flex items-center gap-0.5 ml-1">
                        <kbd className="text-[9px] bg-white border border-gray-200 rounded px-1 py-px text-gray-400 font-mono">⌘</kbd>
                        <kbd className="text-[9px] bg-white border border-gray-200 rounded px-1 py-px text-gray-400 font-mono">K</kbd>
                    </div>
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center outline-none rounded-lg transition-opacity hover:opacity-85">
                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center border border-black/[0.06] shadow-sm">
                                <span className="font-ui text-[10px] font-bold text-gray-600">
                                    {initials}
                                </span>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 mt-1.5 rounded-xl border-black/[0.06] shadow-lg">
                        {user?.name && (
                            <>
                                <div className="px-3 py-2">
                                    <p className="font-ui text-[13px] font-medium text-gray-900">{user.name}</p>
                                    <p className="font-ui text-[11px] text-gray-500">{user.email}</p>
                                </div>
                                <DropdownMenuSeparator className="bg-black/[0.06]" />
                            </>
                        )}
                        <DropdownMenuItem className="font-ui text-[12px] cursor-pointer rounded-lg m-1" asChild>
                            <Link href="/settings">Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-black/[0.06]" />
                        <DropdownMenuItem className="font-ui text-[12px] text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg m-1" onClick={handleLogout}>
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
        </header>
    );
}
