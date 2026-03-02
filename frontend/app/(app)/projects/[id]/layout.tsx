'use client';

import { useParams } from 'next/navigation';
import { ProjectProvider, useProject } from './_context/project-context';
import { Navigator } from './_components/navigator';
import { Inspector } from './_components/inspector';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';
import { TooltipProvider } from '@/components/ui/tooltip';

function WorkspaceShell({ children }: { children: React.ReactNode }) {
    const { inspectorContent, closeInspector } = useProject();
    const hasInspector = !!inspectorContent;

    return (
        <div className="h-[calc(100vh-5rem)] overflow-hidden">
            <ResizablePanelGroup orientation="horizontal" className="h-full">
                {/* Left Navigator */}
                <ResizablePanel
                    defaultSize={18}
                    minSize={14}
                    maxSize={28}
                    collapsible
                    className="hidden md:block"
                >
                    <Navigator />
                </ResizablePanel>

                <ResizableHandle withHandle className="hidden md:flex" />

                {/* Center Workspace */}
                <ResizablePanel defaultSize={hasInspector ? 55 : 82} minSize={40}>
                    <div className="h-full overflow-y-auto">
                        {children}
                    </div>
                </ResizablePanel>

                {/* Right Inspector — contextual */}
                {hasInspector && (
                    <>
                        <ResizableHandle withHandle />
                        <ResizablePanel
                            defaultSize={27}
                            minSize={20}
                            maxSize={40}
                        >
                            <Inspector
                                content={inspectorContent!}
                                onClose={closeInspector}
                            />
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </div>
    );
}

export default function ProjectLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const projectId = params.id as string;

    return (
        <TooltipProvider>
            <ProjectProvider projectId={projectId}>
                <WorkspaceShell>{children}</WorkspaceShell>
            </ProjectProvider>
        </TooltipProvider>
    );
}
