import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  Settings, 
  Sparkles,
  Activity,
  LogOut,
  User
} from 'lucide-react';
import { cn, getInitials } from '@/utils';
import { useAuthStore } from '@/store';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/papers', icon: FileText, label: 'Papers' },
  { path: '/activity', icon: Activity, label: 'Activity' },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 h-screen bg-kimidark-800 border-r border-kimidark-600 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-kimidark-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-kimipurple-500 to-kimiblue-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">Kimi UI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-kimipurple-500/20 text-kimipurple-400 border border-kimipurple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-kimidark-700'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive && 'text-kimipurple-400')} />
                {item.label}
              </NavLink>
            );
          })}
        </div>

        {/* Stats Preview */}
        <div className="mt-8 px-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Quick Stats</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Projects</span>
              <span className="text-white font-mono">-</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Tasks</span>
              <span className="text-white font-mono">-</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Papers</span>
              <span className="text-white font-mono">-</span>
            </div>
          </div>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-kimidark-600">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-kimidark-600 flex items-center justify-center border border-kimidark-500">
            <User className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || user?.email || 'Guest'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.credits_remaining?.toFixed(2) || 0} credits
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
