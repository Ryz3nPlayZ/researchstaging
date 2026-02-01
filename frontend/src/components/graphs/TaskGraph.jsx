import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Badge } from '../ui/badge';
import { Clock, Loader2, CheckCircle, XCircle, Bot, Route, Search, FileText, Quote, Brain, Edit, ArrowRight } from 'lucide-react';

// Custom Task Node Component
const TaskNode = ({ data }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'running':
        return { icon: Loader2, color: 'border-blue-500 bg-blue-500/10', iconClass: 'text-blue-500 animate-spin' };
      case 'completed':
        return { icon: CheckCircle, color: 'border-green-500 bg-green-500/10', iconClass: 'text-green-500' };
      case 'failed':
        return { icon: XCircle, color: 'border-red-500 bg-red-500/10', iconClass: 'text-red-500' };
      case 'ready':
        return { icon: Clock, color: 'border-cyan-500 bg-cyan-500/10', iconClass: 'text-cyan-500' };
      default:
        return { icon: Clock, color: 'border-yellow-500/50 bg-yellow-500/5', iconClass: 'text-yellow-500' };
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'literature_search': return Search;
      case 'pdf_acquisition': return FileText;
      case 'reference_extraction': return Quote;
      case 'summarization': return Brain;
      case 'synthesis': return Brain;
      case 'drafting': return Edit;
      default: return FileText;
    }
  };

  const statusConfig = getStatusConfig(data?.status);
  const StatusIcon = statusConfig.icon;
  const TypeIcon = getTypeIcon(data?.type);

  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${statusConfig.color} bg-card min-w-[200px] shadow-sm relative`}>
      {/* Input handle (left side) - for incoming edges */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-1">
        <TypeIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium truncate flex-1">{data?.label || 'Task'}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <StatusIcon className={`h-3.5 w-3.5 ${statusConfig.iconClass}`} />
        <span className="text-xs text-muted-foreground capitalize">{data?.status || 'pending'}</span>
      </div>

      {/* Output handle (right side) - for outgoing edges */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </div>
  );
};

// Custom Agent Node Component
const AgentNode = ({ data }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'running':
        return { color: 'border-blue-500 bg-blue-500/10 shadow-blue-500/20 shadow-lg', pulse: true };
      case 'completed':
        return { color: 'border-green-500/50 bg-green-500/5', pulse: false };
      default:
        return { color: 'border-border bg-card', pulse: false };
    }
  };

  const getTypeConfig = (type) => {
    switch (type) {
      case 'orchestrator':
        return { icon: Route, color: 'bg-purple-500/10 text-purple-500 border-purple-500/50' };
      case 'executor':
        return { icon: Bot, color: 'bg-blue-500/10 text-blue-500 border-blue-500/50' };
      case 'verifier':
        return { icon: CheckCircle, color: 'bg-orange-500/10 text-orange-500 border-orange-500/50' };
      case 'specialist':
        return { icon: Search, color: 'bg-green-500/10 text-green-500 border-green-500/50' };
      default:
        return { icon: Bot, color: 'bg-slate-500/10 text-slate-500 border-slate-500/50' };
    }
  };

  const statusConfig = getStatusConfig(data?.status);
  const typeConfig = getTypeConfig(data?.type);
  const TypeIcon = typeConfig.icon;

  return (
    <div className={`px-4 py-3 rounded-xl border-2 ${statusConfig.color} ${typeConfig.color} min-w-[180px] transition-all duration-300 ${statusConfig.pulse ? 'animate-pulse' : ''} relative shadow-sm`}>
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className={`w-10 h-10 rounded-lg ${typeConfig.color.split(' ')[0]} flex items-center justify-center border`}>
          <TypeIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{data?.label || 'Agent'}</div>
          <div className="text-[10px] text-muted-foreground capitalize">{data?.type || 'agent'}</div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{data?.description || ''}</p>
      {data?.status && data.status !== 'idle' && (
        <Badge
          variant="outline"
          className={`text-[10px] ${data.status === 'running' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}
        >
          {data.status}
        </Badge>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />
    </div>
  );
};

const nodeTypes = {
  taskNode: TaskNode,
  agentNode: AgentNode,
};

export const TaskGraph = ({ nodes: initialNodes, edges: initialEdges, type = 'task' }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const initializedRef = useRef(false);

  // Update nodes and edges when props change - use JSON string for deep comparison
  useEffect(() => {
    if (initialNodes && initialNodes.length > 0) {
      setNodes(initialNodes);
      initializedRef.current = true;
    }
  }, [initialNodes, setNodes]);

  useEffect(() => {
    if (initialEdges && initialEdges.length > 0) {
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  // Show loading state while data is being fetched
  if (!initialNodes || initialNodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg border border-border" style={{ minHeight: '500px' }}>
        <p className="text-sm text-muted-foreground">No graph data available</p>
      </div>
    );
  }

  // Count tasks by status for legend
  const statusCounts = nodes.reduce((acc, node) => {
    const status = node.data?.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="w-full h-full bg-background rounded-lg border border-border overflow-hidden" style={{ height: '600px' }}>
      {/* Status Legend */}
      <div className="absolute top-4 left-4 z-10 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-sm">
        <div className="text-xs font-medium text-muted-foreground mb-2">Task Status</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Completed: {statusCounts.completed || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Running: {statusCounts.running || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span>Ready: {statusCounts.ready || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Failed: {statusCounts.failed || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Pending: {statusCounts.pending || 0}</span>
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#64748b', strokeWidth: 2 },
          animated: false,
        }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background color="#e2e8f0" gap={20} size={1} />
        <Controls
          className="bg-card border border-border rounded-lg shadow-sm"
          showInteractive={false}
        />
        <MiniMap
          className="bg-card border border-border rounded-lg shadow-sm"
          nodeColor={(node) => {
            if (node.data?.status === 'running') return '#3b82f6';
            if (node.data?.status === 'completed') return '#22c55e';
            if (node.data?.status === 'failed') return '#ef4444';
            if (node.data?.status === 'ready') return '#06b6d4';
            return '#94a3b8';
          }}
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>
    </div>
  );
};

export const AgentGraph = ({ nodes: initialNodes, edges: initialEdges }) => {
  return <TaskGraph nodes={initialNodes} edges={initialEdges} type="agent" />;
};
