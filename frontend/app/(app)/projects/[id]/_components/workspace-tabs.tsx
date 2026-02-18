import { motion } from "framer-motion";

export type Tab = 'overview' | 'documents' | 'files' | 'literature' | 'analysis';

interface WorkspaceTabsProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    counts?: {
        documents: number;
        files: number;
        literature: number;
    };
}

export function WorkspaceTabs({ activeTab, onTabChange, counts }: WorkspaceTabsProps) {
    const tabs: { id: Tab; label: string; count?: number }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'documents', label: 'Documents', count: counts?.documents },
        { id: 'files', label: 'Files', count: counts?.files },
        { id: 'literature', label: 'Literature', count: counts?.literature },
        { id: 'analysis', label: 'Analysis' },
    ];

    return (
        <div className="flex items-center gap-1 border-b border-gray-100 mb-8">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'text-[#1B512D]'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {activeTab === tab.id && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1C7C54]"
                        />
                    )}
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                        <span className={`ml-2 text-xs py-0.5 px-2 rounded-full ${activeTab === tab.id
                                ? 'bg-[#DEF4C6] text-[#1C7C54]'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
