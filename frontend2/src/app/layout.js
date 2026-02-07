import { ProjectProvider } from '@/lib/ProjectContext';
import './globals.css';

export const metadata = {
    title: 'Antigravity | Research Workspace',
    description: 'AI-Native Research Execution Environment',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <ProjectProvider>
                    {children}
                </ProjectProvider>
            </body>
        </html>
    );
}
