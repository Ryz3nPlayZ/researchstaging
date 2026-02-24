import { Project, calcProjectProgress, relativeTime } from '@/lib/types';
import { Plus, Upload, CheckCircle, AlertCircle, Loader2, Workflow, Activity, TerminalSquare } from 'lucide-react';
import { TaskResponse, ExecutionLogEntry } from '@/lib/types';

interface OverviewTabProps {
    project: Project;
    tasks: TaskResponse[];
    executionLogs: ExecutionLogEntry[];
    onCreateDocument: () => void;
    onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    creatingDoc: boolean;
}

export function OverviewTab({ project, tasks, executionLogs, onCreateDocument, onUploadFile, creatingDoc }: OverviewTabProps) {
    const uiStatus = project.status;
    const progress = calcProjectProgress(project.task_counts);

    return (
        <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Card */}
                <div className="bg-white rounded-xl p-4 border border-black/5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-gray-400" />
                            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Project Status</h3>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium capitalize bg-gray-100 text-gray-600">
                            {uiStatus}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-2xl font-bold text-gray-900 tracking-tight">{progress}%</span>
                        <span className="text-[12px] font-medium text-gray-400">Progress</span>
                    </div>
                    {uiStatus === 'executing' && (
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000 bg-gray-900"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Tasks Summary */}
                <div className="bg-white rounded-xl p-4 border border-black/5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Workflow size={14} className="text-gray-400" />
                        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Activity</h3>
                    </div>
                    {project.task_counts && Object.keys(project.task_counts).length > 0 ? (
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                            {Object.entries(project.task_counts).map(([state, count]) => (
                                <div key={state} className="flex items-center justify-between col-span-1">
                                    <span className="text-[12px] text-gray-500 capitalize">{state}</span>
                                    <span className="text-[13px] font-medium text-gray-900">{count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[12px] text-gray-400 italic">No activity recorded yet</p>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-4 border border-black/5 shadow-sm">
                    <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                        <button
                            onClick={onCreateDocument}
                            disabled={creatingDoc}
                            className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-black/5 flex items-center gap-2.5 bg-white"
                        >
                            <Plus size={14} className="text-gray-400" />
                            {creatingDoc ? 'Creating...' : 'New Document'}
                        </button>
                        <label className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-black/5 cursor-pointer bg-white">
                            <Upload size={14} className="text-gray-400" />
                            Upload File
                            <input type="file" className="hidden" onChange={onUploadFile} />
                        </label>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Task Pipeline Visualizer */}
                <div className="bg-white rounded-xl border border-black/5 shadow-sm flex flex-col h-[400px]">
                    <div className="p-4 border-b border-black/5 flex items-center gap-2 shrink-0">
                        <Workflow size={14} className="text-gray-400" />
                        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Research Pipeline</h3>
                    </div>
                    <div className="overflow-y-auto p-2 custom-scrollbar">
                        {tasks.length > 0 ? (
                            <div className="space-y-0.5">
                                {tasks.map((task) => (
                                    <div key={task.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {task.state === 'completed' ? (
                                                <CheckCircle size={14} className="text-gray-400 shrink-0" />
                                            ) : task.state === 'running' ? (
                                                <Loader2 size={14} className="text-gray-400 animate-spin shrink-0" />
                                            ) : task.state === 'failed' ? (
                                                <AlertCircle size={14} className="text-gray-400 shrink-0" />
                                            ) : (
                                                <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                                            )}
                                            <span className="text-[13px] font-medium text-gray-700 truncate">{task.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 pl-2">
                                            {task.error_message && (
                                                <span className="text-[11px] text-red-500 max-w-[150px] truncate">
                                                    {task.error_message}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-[12px] text-gray-400 italic">No tasks in pipeline</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Execution Audit Trail */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[400px] overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <TerminalSquare size={14} className="text-gray-400" />
                            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Execution Log</h3>
                        </div>
                    </div>
                    <div className="p-3 overflow-y-auto custom-scrollbar font-mono text-[11px]">
                        {executionLogs.length > 0 ? (
                            <div className="space-y-1">
                                {executionLogs.slice(0, 15).map((log) => (
                                    <div key={log.id} className="flex items-start gap-3 py-1.5 hover:bg-gray-50 px-2 rounded transition-colors group">
                                        <span className="text-gray-400 shrink-0 w-12">{relativeTime(log.timestamp).replace(/ ago/, '')}</span>
                                        <div className="min-w-0 flex-1">
                                            <span className={`
                                                ${log.level === 'error' ? 'text-red-600' :
                                                    log.level === 'warning' ? 'text-amber-600' :
                                                        'text-gray-600'} 
                                                break-all
                                            `}>
                                                {log.message}
                                            </span>
                                            <span className="text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                [{log.event_type}]
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-gray-400 italic">No execution events recorded</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
