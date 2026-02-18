import Link from 'next/link';
import type { Project } from '@/lib/types';
import { mapProjectStatus, calcProjectProgress, relativeTime, truncate } from '@/lib/types';

interface ProjectCardProps {
    project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
    const uiStatus = mapProjectStatus(project.status);
    const progress = calcProjectProgress(project.task_counts);
    const totalTasks = project.task_counts
        ? Object.values(project.task_counts).reduce((a, b) => a + b, 0)
        : 0;
    const isActive = uiStatus === 'active';

    return (
        <Link href={`/projects/${project.id}`} className="block h-full">
            <div
                className="glass rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:scale-[1.01] group border border-white/20"
            >
                {/* Header: Status dot + Updated */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-[#1C7C54]' :
                            uiStatus === 'planning' ? 'bg-amber-400' :
                                'bg-gray-300'
                            }`} />
                        <span className="text-xs font-medium text-gray-500 capitalize">
                            {uiStatus}
                        </span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{relativeTime(project.updated_at)}</span>
                </div>

                {/* Research goal */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight line-clamp-2 group-hover:text-[#1C7C54] transition-colors">
                    {project.research_goal}
                </h3>

                {/* Output type */}
                <p className="text-sm text-gray-500 font-medium capitalize mb-6 line-clamp-1">
                    {project.output_type.replace(/_/g, ' ')}
                    {project.audience ? ` · ${project.audience}` : ''}
                </p>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-gray-100/50">
                    {/* Progress bar for active projects */}
                    {isActive && (
                        <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between text-xs font-medium">
                                <span className="text-gray-500">Progress</span>
                                <span className="text-[#1C7C54]">{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 bg-[#1C7C54]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                        <span>{totalTasks} task{totalTasks !== 1 ? 's' : ''}</span>
                        {/* Document count not yet supported by backend */}
                    </div>
                </div>
            </div>
        </Link>
    );
}
