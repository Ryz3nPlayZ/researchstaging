
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen = true, onClose }) => {
  const navItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: 'dashboard' },
    { id: View.LIBRARY, label: 'Library', icon: 'menu_book' },
    { id: View.FILES, label: 'Files', icon: 'folder' },
    { id: View.ANALYSIS, label: 'Analysis', icon: 'code' },
    { id: View.MEMORY, label: 'Memory', icon: 'psychology' },
    { id: View.CITATIONS, label: 'Citations', icon: 'link' },
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky inset-y-0 left-0 z-40
          w-64 h-screen
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          border-r border-slate-200 dark:border-slate-800
          bg-white dark:bg-slate-900
          flex flex-col shrink-0
        `}
      >
      {/* Mobile close button */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none tracking-tight">Research AI</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Workspace</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          aria-label="Close menu"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Desktop header */}
      <div className="hidden md:flex p-6 items-center gap-3">
        <div className="size-10 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">auto_awesome</span>
        </div>
        <div>
          <h1 className="text-sm font-bold leading-none tracking-tight">Research AI</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Workspace</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === item.id 
                ? 'bg-primary/10 text-primary font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${activeView === item.id ? 'material-symbols-filled' : ''}`}>
              {item.icon}
            </span>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
        
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onViewChange(View.SETTINGS)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === View.SETTINGS 
                ? 'bg-primary/10 text-primary font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2">
          <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <img 
              alt="User Profile" 
              className="w-full h-full object-cover" 
              src="https://picsum.photos/seed/drjulian/200" 
            />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold truncate">Dr. Julian Vane</p>
            <p className="text-[10px] text-slate-500 truncate">Pro Account</p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
