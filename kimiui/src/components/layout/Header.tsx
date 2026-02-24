import { Bell, Search, Command } from 'lucide-react';
import { cn } from '@/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <header className="h-16 border-b border-kimidark-600 bg-kimidark-800/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-9 pr-10 py-2 bg-kimidark-700 border border-kimidark-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-kimipurple-500/50 focus:ring-1 focus:ring-kimipurple-500/30"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-xs text-gray-500">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-kimidark-700 border border-kimidark-600 text-gray-400 hover:text-white hover:border-kimidark-500 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-kimipurple-500 rounded-full" />
        </button>

        {children}
      </div>
    </header>
  );
}
