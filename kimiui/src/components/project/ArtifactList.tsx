import { FileText, Download, ExternalLink } from 'lucide-react';
import { formatDate, truncate } from '@/utils';
import type { Artifact } from '@/types';

interface ArtifactListProps {
  artifacts: Artifact[];
  onView?: (artifact: Artifact) => void;
}

const artifactIcons: Record<string, React.ReactNode> = {
  summary: <FileText className="w-4 h-4 text-blue-400" />,
  draft: <FileText className="w-4 h-4 text-purple-400" />,
  paper: <FileText className="w-4 h-4 text-green-400" />,
  reference: <FileText className="w-4 h-4 text-yellow-400" />,
  default: <FileText className="w-4 h-4 text-gray-400" />,
};

export function ArtifactList({ artifacts, onView }: ArtifactListProps) {
  if (artifacts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No artifacts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {artifacts.map((artifact) => (
        <div
          key={artifact.id}
          onClick={() => onView?.(artifact)}
          className="flex items-center gap-3 p-3 rounded-lg bg-kimidark-700/50 border border-kimidark-600 hover:border-kimidark-500 hover:bg-kimidark-700 transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-kimidark-600 flex items-center justify-center flex-shrink-0">
            {artifactIcons[artifact.artifact_type] || artifactIcons.default}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white truncate">
              {truncate(artifact.title, 60)}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="capitalize">{artifact.artifact_type}</span>
              <span>•</span>
              <span>v{artifact.version}</span>
              <span>•</span>
              <span>{formatDate(artifact.created_at)}</span>
            </div>
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
}
