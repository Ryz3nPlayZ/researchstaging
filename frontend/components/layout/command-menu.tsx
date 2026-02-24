'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, FolderOpen, Settings, Home, FileText, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CommandMenu({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [open, onOpenChange]);

    const runCommand = (command: () => void) => {
        onOpenChange(false);
        command();
    };

    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-[6px]"
                        onClick={() => onOpenChange(false)}
                    />
                    <div className="relative w-full max-w-[480px] px-4 pointer-events-none z-[101]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -10 }}
                            transition={{
                                type: 'spring',
                                damping: 30,
                                stiffness: 400,
                                mass: 0.8,
                            }}
                            className="w-full bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_16px_64px_rgba(0,0,0,0.16)] border border-black/[0.06] overflow-hidden flex flex-col font-ui pointer-events-auto"
                        >
                            <Command label="Global Command Menu" shouldFilter={false} filter={(value, search) => {
                                if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                                return 0;
                            }}>
                                <div className="flex items-center border-b border-black/[0.06] px-3.5">
                                    <Search className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
                                    <Command.Input
                                        autoFocus
                                        placeholder="Search projects, documents, or jump to..."
                                        className="flex-1 h-12 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-[14px]"
                                    />
                                </div>

                                <Command.List className="max-h-[260px] overflow-y-auto p-1.5 custom-scrollbar">
                                    <Command.Empty className="p-5 text-center text-[13px] text-gray-400">
                                        No results found.
                                    </Command.Empty>

                                    <Command.Group heading="Navigation" className="px-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 mt-1.5">
                                        <Command.Item
                                            value="dashboard"
                                            onSelect={() => runCommand(() => router.push('/dashboard'))}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[13px] text-gray-700 hover:bg-gray-100/80 aria-selected:bg-gray-100/80 aria-selected:text-gray-900 transition-colors"
                                        >
                                            <Home className="w-3.5 h-3.5 text-gray-400" />
                                            <span>Dashboard</span>
                                        </Command.Item>
                                        <Command.Item
                                            value="projects"
                                            onSelect={() => runCommand(() => router.push('/projects'))}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[13px] text-gray-700 hover:bg-gray-100/80 aria-selected:bg-gray-100/80 aria-selected:text-gray-900 transition-colors"
                                        >
                                            <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
                                            <span>Projects</span>
                                        </Command.Item>
                                        <Command.Item
                                            value="literature search"
                                            onSelect={() => runCommand(() => router.push('/literature'))}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[13px] text-gray-700 hover:bg-gray-100/80 aria-selected:bg-gray-100/80 aria-selected:text-gray-900 transition-colors"
                                        >
                                            <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                                            <span>Literature</span>
                                        </Command.Item>
                                        <Command.Item
                                            value="settings"
                                            onSelect={() => runCommand(() => router.push('/settings'))}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[13px] text-gray-700 hover:bg-gray-100/80 aria-selected:bg-gray-100/80 aria-selected:text-gray-900 transition-colors"
                                        >
                                            <Settings className="w-3.5 h-3.5 text-gray-400" />
                                            <span>Settings</span>
                                        </Command.Item>
                                    </Command.Group>

                                    <Command.Group heading="Quick Actions" className="px-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 mt-3">
                                        <Command.Item
                                            value="new research project"
                                            onSelect={() => runCommand(() => router.push('/new'))}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[13px] text-gray-700 hover:bg-gray-100/80 aria-selected:bg-gray-100/80 aria-selected:text-gray-900 transition-colors"
                                        >
                                            <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                            <span>New Research Project</span>
                                        </Command.Item>
                                    </Command.Group>
                                </Command.List>

                                {/* Footer hint */}
                                <div className="flex items-center justify-between px-3.5 py-2 border-t border-black/[0.04] bg-gray-50/50">
                                    <span className="text-[10px] text-gray-400">Navigate with ↑↓ · Select with ↵</span>
                                    <span className="text-[10px] text-gray-400">ESC to close</span>
                                </div>
                            </Command>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
