import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { BookOpen, ExternalLink, FileText, Quote, Users } from 'lucide-react';

// Custom Citation Node Component
const CitationNode = ({ data }) => {
  const isPrimary = data?.isPrimary;
  const baseClasses = isPrimary 
    ? 'border-primary bg-primary/5 shadow-lg' 
    : 'border-muted bg-card/80';
  
  return (
    <div 
      className={`px-3 py-2 rounded-lg border-2 ${baseClasses} max-w-[200px] cursor-pointer hover:shadow-xl transition-shadow`}
      title={data?.title}
    >
      <div className="flex items-start gap-2 mb-1">
        {isPrimary ? (
          <BookOpen className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
        ) : (
          <Quote className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
        )}
        <span className="text-xs font-medium leading-tight line-clamp-2">
          {data?.label || 'Paper'}
        </span>
      </div>
      
      <div className="space-y-1">
        {data?.authors?.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="h-2.5 w-2.5" />
            <span className="truncate">{data.authors.slice(0, 2).join(', ')}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {data?.year && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
              {data.year}
            </Badge>
          )}
          {data?.citations > 0 && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
              {data.citations} cited
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1 mt-1">
          {data?.hasFullText && (
            <FileText className="h-3 w-3 text-green-500" title="Full text available" />
          )}
          {data?.hasSummary && (
            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-blue-500/10 text-blue-500 border-blue-500/20">
              AI Summary
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  citationNode: CitationNode,
};

export const CitationNetwork = ({ projectId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    
    const fetchNetwork = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const API_URL = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${API_URL}/api/projects/${projectId}/citation-network`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch citation network');
        }
        
        const data = await response.json();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setStats(data.stats);
      } catch (err) {
        console.error('Citation network error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNetwork();
  }, [projectId, setNodes, setEdges]);

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg border border-border">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading citation network...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg border border-border">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-2">Failed to load citation network</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!nodes || nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg border border-border">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No papers found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Execute the pipeline to discover literature
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Stats Bar */}
      {stats && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">{stats.primary_papers} Papers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Quote className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">{stats.references} References</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              Total Citations: {stats.total_citations?.toLocaleString()}
            </span>
          </div>
        </div>
      )}
      
      {/* Graph */}
      <div className="flex-1 bg-background rounded-lg border border-border overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          proOptions={proOptions}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{
            type: 'bezier',
            style: { stroke: '#94a3b8', strokeWidth: 1 },
            animated: false,
          }}
        >
          <Background color="#e2e8f0" gap={20} size={1} />
          <Controls 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
            showInteractive={false}
          />
          <MiniMap 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
            nodeColor={(node) => {
              if (node.data?.isPrimary) return '#6366f1';
              return '#94a3b8';
            }}
            maskColor="rgba(255, 255, 255, 0.8)"
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default CitationNetwork;
