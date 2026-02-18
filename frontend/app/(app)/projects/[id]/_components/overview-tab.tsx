import Link from 'next/link';
import { Project, calcProjectProgress } from '@/lib/types';
import { Plus, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { TaskResponse } from '@/lib/types';

interface OverviewTabProps {
    project: Project;
    tasks: TaskResponse[];
    onCreateDocument: () => void;
    onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    creatingDoc: boolean;
}

export function OverviewTab({ project, tasks, onCreateDocument, onUploadFile, creatingDoc }: OverviewTabProps) {
    const uiStatus = project.status; // Directly use status or map it if needed
    const progress = calcProjectProgress(project.task_counts);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Card */}
            <div className="glass rounded-2xl p-6 border border-white/20">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Project Status</h3>
                <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${uiStatus === 'executing' ? 'bg-[#DEF4C6] text-[#1C7C54] animate-pulse' :
                            uiStatus === 'completed' ? 'bg-blue-50 text-blue-600' :
                                'bg-gray-100 text-gray-600'
                        }`}>
                        {uiStatus}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">{progress}%</span>
                </div>

                {uiStatus === 'executing' && (
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-1000 bg-[#1C7C54]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Tasks Summary */}
            <div className="glass rounded-2xl p-6 border border-white/20">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Activity</h3>
                {project.task_counts && Object.keys(project.task_counts).length > 0 ? (
                    <div className="space-y-3">
                        {Object.entries(project.task_counts).map(([state, count]) => (
                            <div key={state} className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 capitalize">{state}</span>
                                <span className="font-medium text-gray-900">{count}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">No activity recorded yet</p>
                )}
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-2xl p-6 border border-white/20">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="space-y-3">
                    <button
                        onClick={onCreateDocument}
                        disabled={creatingDoc}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-100 flex items-center gap-3 bg-white/50"
                    >
                        <div className="p-1.5 bg-[#DEF4C6] rounded-lg text-[#1C7C54]">
                            <Plus size={16} />
                        </div>
                        {creatingDoc ? 'Creating...' : 'New Document'}
                    </button>
                    <label className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-100 cursor-pointer bg-white/50">
                        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                            <Upload size={16} />
                        </div>
                        Upload File
                        <input type="file" className="hidden" onChange={onUploadFile} />
                    </label>
                </div>
            </div>

            {/* Task Pipeline Visualizer */}
            {tasks.length > 0 && (
                <div className="col-span-1 md:col-span-3 glass rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Research Pipeline</h3>
                    <div className="space-y-0">
                        {tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between py-3 border-b border-gray-100/50 last:border-0 hover:bg-white/30 px-2 rounded-lg transition-colors">
                                <div className="flex items-center gap-4">
                                    {task.state === 'completed' ? (
                                        <CheckCircle size={18} className="text-[#1C7C54]" />
                                    ) : task.state === 'running' ? (
                                        <Loader2 size={18} className="text-blue-500 animate-spin" />
                                    ) : task.state === 'failed' ? (
                                        <AlertCircle size={18} className="text-red-500" />
                                    ) : (
                                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                                    )}
                                    <span className="text-sm font-medium text-gray-900">{task.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {task.error_message && (
                                        <span className="text-xs text-red-500 max-w-[300px] truncate bg-red-50 px-2 py-1 rounded">
                                            {task.error_message}
                                        </span>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${task.state === 'completed' ? 'bg-[#DEF4C6] text-[#1C7C54]' :
                                            task.state === 'running' ? 'bg-blue-50 text-blue-600' :
                                                task.state === 'failed' ? 'bg-red-50 text-red-600' :
                                                    'bg-gray-100 text-gray-500'
                                        }`}>
                                        {task.state}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
