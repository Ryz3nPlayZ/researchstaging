# Implementation Plan: Paper Claims Graph

## Overview
Upload a research paper → AI extracts claims → Interactive graph visualization of claims and their relationships (supports, contradicts, extends, etc.).

---

## Part 1: Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PAPER CLAIMS GRAPH SYSTEM                           │
└─────────────────────────────────────────────────────────────────────────────┘

UPLOAD & PROCESSING:
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PDF Upload │───▶│ Text Extract │───▶│ Claim Extract│───▶│  Graph Build │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                   │
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA MODEL                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PaperUpload                                                                 │
│  ├── id, filename, user_id, project_id                                       │
│  ├── extracted_text (full paper text)                                        │
│  ├── processing_status (pending/processing/completed/failed)                 │
│  └── created_at                                                              │
│                                                                              │
│  ClaimNode (Table: paper_claims)                                             │
│  ├── id, paper_upload_id                                                     │
│  ├── claim_text (the actual claim statement)                                 │
│  ├── claim_type (finding|method|hypothesis|limitation|future_work)           │
│  ├── section (abstract|intro|methods|results|discussion|conclusion)          │
│  ├── confidence_score (0-1, extraction confidence)                           │
│  ├── evidence_text (supporting text from paper)                              │
│  ├── paragraph_index (location in paper)                                     │
│  ├── metadata (line numbers, page, etc.)                                     │
│  └── embedding_vector (for similarity search)                                │
│                                                                              │
│  ClaimEdge (Table: claim_relationships)                                      │
│  ├── id, source_claim_id, target_claim_id                                    │
│  ├── relation_type (supports|contradicts|extends|relates_to|method_of)       │
│  ├── strength_score (0-1, relationship confidence)                           │
│  ├── evidence_quote (text evidence from paper)                               │
│  └── inferred_by (explicit|implicit|llm_inferred)                            │
│                                                                              │
│  GraphSession (for user exploration state)                                   │
│  ├── id, user_id, paper_upload_id                                            │
│  ├── view_state (zoom, pan, selected nodes)                                  │
│  ├── filters_applied (types, sections, etc.)                                 │
│  └── annotations (user notes on claims)                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                                                   │
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  POST   /api/papers/upload              → Upload PDF, queue processing       │
│  GET    /api/papers/{id}/status         → Check processing status            │
│  GET    /api/papers/{id}/claims         → List all claims (paginated)        │
│  GET    /api/papers/{id}/graph          → Full graph data (nodes + edges)    │
│  GET    /api/papers/{id}/claims/{cid}   → Single claim with context          │
│  POST   /api/claims/{id}/feedback       → "This is/isn't a valid claim"      │
│  POST   /api/claims/{id}/relationships  → Add manual relationship            │
│  DELETE /api/claims/{id}/relationships/{rid} → Remove relationship           │
│  GET    /api/claims/similar/{id}        → Find semantically similar claims   │
│  GET    /api/graph/compare              → Compare claims across papers       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                                                   │
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND VISUALIZATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Upload View:                                                                │
│  ┌─────────────────────────────────────────┐                                 │
│  │  [Drop PDF here or click to browse]     │                                 │
│  │  Processing... [████████░░] 80%         │                                 │
│  │  • Extracting text                      │                                 │
│  │  • Identifying claims (47 found)        │                                 │
│  │  • Building relationship graph          │                                 │
│  └─────────────────────────────────────────┘                                 │
│                                                                              │
│  Graph Explorer View:                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [Filters ▼] [Search claims...] [Layout: Force|Hierarchical] [?]   │    │
│  │                                                                     │    │
│  │     ┌─────────┐         ┌─────────┐                                │    │
│  │     │Hypothesis│────────▶│Finding 1│──────┐                       │    │
│  │     │  (H1)   │ supports │ (high) │      │                        │    │
│  │     └─────────┘         └─────────┘      │                        │    │
│  │                              │            ▼                        │    │
│  │                         contradicts  ┌─────────┐                   │    │
│  │                              │       │Finding 2│                   │    │
│  │                              ▼       │ (low)   │                   │    │
│  │     ┌─────────┐         ┌─────────┐  └─────────┘                   │    │
│  │     │Method   │────────▶│Limitation                             │    │
│  │     │ (M1)   │  used_by │  (L1)   │                              │    │
│  │     └─────────┘         └─────────┘                                │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐   │    │
│  │  │ Selected: Finding 1                                          │   │    │
│  │  │ "Neural networks outperform traditional methods by 15%..."   │   │    │
│  │  │ Section: Results (p.4, para 2)                               │   │    │
│  │  │ Evidence: "Table 2 shows the comparison..."                   │   │    │
│  │  │ [Highlight in PDF] [Copy] [Add to project claims]            │   │    │
│  │  └─────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Backend Implementation

### 2.1 Database Migrations

```python
# alembic migration
"""
Create paper_claims table
Create claim_relationships table
Create paper_uploads table
"""

# models.py additions
class PaperUpload(Base):
    __tablename__ = "paper_uploads"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID, ForeignKey("projects.id"), nullable=False)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size_bytes = Column(Integer)
    
    # Processing status
    status = Column(String, default="pending")  # pending, processing, completed, failed
    status_message = Column(String, nullable=True)
    
    # Extracted content
    extracted_text = Column(Text, nullable=True)
    extraction_metadata = Column(JSON, default={})  # pages, sections, etc.
    
    # Stats
    claim_count = Column(Integer, default=0)
    relationship_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class PaperClaim(Base):
    __tablename__ = "paper_claims"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    paper_upload_id = Column(UUID, ForeignKey("paper_uploads.id"), nullable=False)
    
    # Claim content
    claim_text = Column(Text, nullable=False)
    claim_type = Column(String, nullable=False)  # finding, method, hypothesis, limitation, future_work
    
    # Location
    section = Column(String)  # abstract, intro, methods, results, discussion, conclusion
    paragraph_index = Column(Integer)
    sentence_index = Column(Integer)
    page_number = Column(Integer, nullable=True)
    
    # Quality scores
    confidence_score = Column(Float, default=0.0)  # AI extraction confidence
    importance_score = Column(Float, default=0.0)  # Centrality in graph
    
    # Context
    evidence_text = Column(Text)  # Surrounding text supporting the claim
    full_context = Column(Text)  # Full paragraph
    
    # For semantic search
    embedding_vector = Column(Vector(1536), nullable=True)  # pgvector
    
    # User feedback
    user_validated = Column(Boolean, nullable=True)  # True = valid, False = invalid
    
    created_at = Column(DateTime, default=datetime.utcnow)


class ClaimRelationship(Base):
    __tablename__ = "claim_relationships"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    paper_upload_id = Column(UUID, ForeignKey("paper_uploads.id"), nullable=False)
    
    source_claim_id = Column(UUID, ForeignKey("paper_claims.id"), nullable=False)
    target_claim_id = Column(UUID, ForeignKey("paper_claims.id"), nullable=False)
    
    relation_type = Column(String, nullable=False)
    # supports: source supports/validates target
    # contradicts: source contradicts/refutes target
    # extends: source builds upon target
    # relates_to: general connection
    # method_of: source is method used in target
    # cites: source cites target (for cross-paper)
    
    strength_score = Column(Float, default=0.5)
    evidence_quote = Column(Text)  # Text from paper supporting this relationship
    inferred_by = Column(String, default="llm")  # explicit, implicit, llm_inferred, user_added
    
    created_at = Column(DateTime, default=datetime.utcnow)
```

### 2.2 Claim Extraction Service

```python
# claim_extraction_service.py

class ClaimExtractionService:
    """
    Extracts claims from research paper text using LLM.
    """
    
    CLAIM_TYPES = {
        "finding": "A discovered fact or result",
        "method": "A technique, approach, or methodology described",
        "hypothesis": "A proposed explanation or prediction",
        "limitation": "An acknowledged weakness or constraint",
        "future_work": "Suggested future research directions",
        "assumption": "An underlying assumption made",
        "contribution": "The paper's stated contribution",
    }
    
    async def extract_claims_from_text(
        self, 
        paper_text: str,
        paper_structure: Dict[str, Any]  # sections, paragraphs
    ) -> List[Dict[str, Any]]:
        """
        Main entry point: extract all claims from paper.
        """
        claims = []
        
        # Process by section for context
        for section in paper_structure["sections"]:
            section_claims = await self._extract_from_section(
                section["text"],
                section["name"],
                section["paragraphs"]
            )
            claims.extend(section_claims)
        
        # Deduplicate semantically similar claims
        claims = await self._deduplicate_claims(claims)
        
        # Score importance (centrality, evidence strength)
        claims = await self._score_claim_importance(claims)
        
        return claims
    
    async def _extract_from_section(
        self,
        section_text: str,
        section_name: str,
        paragraphs: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Extract claims from a single section.
        Uses LLM with structured output.
        """
        system_prompt = f"""
        You are a research paper analyzer. Extract all claims from the provided text.
        
        Claim types:
        {json.dumps(self.CLAIM_TYPES, indent=2)}
        
        For each claim, identify:
        1. The exact claim statement (quote or paraphrase)
        2. Claim type (from list above)
        3. Supporting evidence (if any in text)
        4. Confidence (0-1)
        
        Return JSON array of claims.
        """
        
        # Process in chunks if section is long
        chunks = self._chunk_text(section_text, max_tokens=4000)
        all_claims = []
        
        for chunk in chunks:
            response = await llm_service.generate(
                prompt=f"Section: {section_name}\n\nText:\n{chunk}",
                system_message=system_prompt,
                response_format={"type": "json_object"}
            )
            
            try:
                claims = json.loads(response).get("claims", [])
                for claim in claims:
                    claim["section"] = section_name
                all_claims.extend(claims)
            except json.JSONDecodeError:
                logger.error(f"Failed to parse claims JSON: {response[:200]}")
        
        return all_claims
    
    async def find_relationships(
        self,
        claims: List[Dict[str, Any]],
        paper_text: str
    ) -> List[Dict[str, Any]]:
        """
        Find relationships between extracted claims.
        """
        relationships = []
        
        # Strategy 1: Proximity-based (claims in same paragraph likely related)
        for i, claim1 in enumerate(claims):
            for claim2 in claims[i+1:]:
                if self._same_paragraph(claim1, claim2):
                    rel = await self._classify_relationship(claim1, claim2, paper_text)
                    if rel:
                        relationships.append(rel)
        
        # Strategy 2: Explicit references ("As shown in Section 3...", "Figure 2 demonstrates...")
        explicit_rels = await self._find_explicit_references(claims, paper_text)
        relationships.extend(explicit_rels)
        
        # Strategy 3: Semantic similarity (embedding-based)
        semantic_rels = await self._find_semantic_relationships(claims)
        relationships.extend(semantic_rels)
        
        return relationships
    
    async def _classify_relationship(
        self,
        claim1: Dict,
        claim2: Dict,
        paper_text: str
    ) -> Optional[Dict]:
        """
        Use LLM to classify relationship between two claims.
        """
        prompt = f"""
        Claim A: {claim1['claim_text']}
        Claim B: {claim2['claim_text']}
        
        What is the relationship between A and B?
        Options: supports, contradicts, extends, method_of, relates_to, none
        
        Respond with JSON: {{"relation": "type", "confidence": 0.8, "reasoning": "..."}}
        """
        
        response = await llm_service.generate(prompt)
        try:
            result = json.loads(response)
            if result.get("relation") != "none":
                return {
                    "source_id": claim1["id"],
                    "target_id": claim2["id"],
                    "relation_type": result["relation"],
                    "strength_score": result.get("confidence", 0.5),
                    "evidence": result.get("reasoning", ""),
                }
        except:
            pass
        return None
```

### 2.3 Graph Processing Pipeline

```python
# claim_processing_pipeline.py

class ClaimProcessingPipeline:
    """
    Async pipeline for processing uploaded papers.
    """
    
    async def process_paper(self, paper_upload_id: str):
        """
        Main processing workflow.
        """
        upload = await self._get_upload(paper_upload_id)
        
        try:
            # 1. Extract text from PDF
            await self._update_status(upload, "processing", "Extracting text...")
            text, structure = await pdf_service.extract_text_with_structure(
                upload.file_path
            )
            
            # 2. Extract claims
            await self._update_status(upload, "processing", "Identifying claims...")
            claims = await claim_extraction_service.extract_claims_from_text(
                text, structure
            )
            
            # 3. Generate embeddings for semantic search
            await self._update_status(upload, "processing", "Generating embeddings...")
            for claim in claims:
                claim["embedding"] = await embedding_service.embed(claim["claim_text"])
            
            # 4. Find relationships
            await self._update_status(upload, "processing", "Building relationship graph...")
            relationships = await claim_extraction_service.find_relationships(
                claims, text
            )
            
            # 5. Save to database
            await self._save_claims_and_relationships(upload.id, claims, relationships)
            
            # 6. Calculate graph metrics
            await self._calculate_graph_metrics(upload.id)
            
            await self._update_status(
                upload, 
                "completed", 
                f"Found {len(claims)} claims, {len(relationships)} relationships",
                claim_count=len(claims),
                relationship_count=len(relationships)
            )
            
        except Exception as e:
            logger.exception("Paper processing failed")
            await self._update_status(upload, "failed", str(e))
    
    async def _calculate_graph_metrics(self, paper_upload_id: str):
        """
        Calculate centrality, clusters, etc.
        """
        # Build NetworkX graph
        G = nx.DiGraph()
        
        claims = await self._get_claims(paper_upload_id)
        for claim in claims:
            G.add_node(claim.id, **claim.to_dict())
        
        relationships = await self._get_relationships(paper_upload_id)
        for rel in relationships:
            G.add_edge(rel.source_claim_id, rel.target_claim_id, **rel.to_dict())
        
        # Calculate centrality (importance score)
        centrality = nx.degree_centrality(G)
        for claim_id, score in centrality.items():
            await self._update_claim_importance(claim_id, score)
```

### 2.4 API Endpoints

```python
# claims_graph_api.py

@router.post("/papers/upload")
async def upload_paper(
    file: UploadFile,
    project_id: str,
    current_user: User = Depends(require_auth)
):
    """Upload PDF and queue for processing."""
    # Save file
    # Create PaperUpload record
    # Queue background processing task
    # Return upload ID for status polling

@router.get("/papers/{upload_id}/status")
async def get_processing_status(upload_id: str):
    """Get current processing status and progress."""

@router.get("/papers/{upload_id}/graph")
async def get_claims_graph(
    upload_id: str,
    layout: str = "force",  # force, hierarchical, circular
    filters: Optional[str] = None  # JSON filter object
):
    """
    Get full graph data for visualization.
    Returns: { nodes: [...], edges: [...], stats: {...} }
    """

@router.get("/papers/{upload_id}/claims")
async def list_claims(
    upload_id: str,
    claim_type: Optional[str] = None,
    section: Optional[str] = None,
    search: Optional[str] = None,
    min_confidence: float = 0.5,
    limit: int = 50,
    offset: int = 0
):
    """Paginated list of claims with filtering."""

@router.post("/claims/{claim_id}/validate")
async def validate_claim(
    claim_id: str,
    is_valid: bool,  # User says this is/isn't a real claim
    current_user: User = Depends(require_auth)
):
    """User feedback on claim extraction quality."""

@router.post("/claims/{claim_id}/relationships")
async def add_manual_relationship(
    claim_id: str,
    target_claim_id: str,
    relation_type: str,
    current_user: User = Depends(require_auth)
):
    """User manually adds a relationship between claims."""

@router.get("/claims/similar/{claim_id}")
async def find_similar_claims(
    claim_id: str,
    threshold: float = 0.8
):
    """Find semantically similar claims using embeddings."""

@router.post("/graph/query")
async def query_graph(
    upload_id: str,
    query: GraphQuery  # "Find all findings that support hypothesis X"
):
    """
    Natural language query against the claims graph.
    Uses LLM to convert query to graph traversal.
    """
```

---

## Part 3: Frontend Implementation

### 3.1 Components Structure

```
frontend/
├── app/(app)/papers/
│   └── [uploadId]/
│       └── graph/
│           └── page.tsx           # Main graph explorer page
│
├── components/claims-graph/
│   ├── upload/
│   │   ├── PaperUploader.tsx      # Drag-drop PDF upload
│   │   ├── ProcessingStatus.tsx   # Progress indicator
│   │   └── UploadHistory.tsx      # List of processed papers
│   │
│   ├── graph/
│   │   ├── GraphCanvas.tsx        # Main graph visualization (React Flow)
│   │   ├── ClaimNode.tsx          # Individual claim node component
│   │   ├── ClaimEdge.tsx          # Relationship edge component
│   │   ├── GraphControls.tsx      # Zoom, pan, layout buttons
│   │   ├── GraphFilters.tsx       # Filter by type, section, confidence
│   │   └── MiniMap.tsx            # Overview map
│   │
│   ├── inspector/
│   │   ├── ClaimInspector.tsx     # Sidebar detail view
│   │   ├── EvidenceViewer.tsx     # Show supporting text
│   │   ├── RelationshipEditor.tsx # Add/remove relationships
│   │   └── ClaimHighlighter.tsx   # Highlight in original PDF
│   │
│   └── query/
│       ├── NaturalLanguageQuery.tsx  # "Ask the graph" input
│       ├── QueryResults.tsx          # Show query results
│       └── SuggestedQueries.tsx      # "Find contradictions", "Show methodology chain"
```

### 3.2 Graph Visualization (React Flow)

```typescript
// components/claims-graph/graph/GraphCanvas.tsx

'use client';

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ClaimNode } from './ClaimNode';
import { ClaimEdge } from './ClaimEdge';

const nodeTypes = {
  claim: ClaimNode,
};

const edgeTypes = {
  relationship: ClaimEdge,
};

interface GraphData {
  nodes: ClaimNodeData[];
  edges: ClaimEdgeData[];
  stats: GraphStats;
}

export function GraphCanvas({ uploadId }: { uploadId: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [layout, setLayout] = useState<'force' | 'hierarchical' | 'circular'>('force');

  // Load graph data
  useEffect(() => {
    fetch(`/api/papers/${uploadId}/graph?layout=${layout}`)
      .then(r => r.json())
      .then((data: GraphData) => {
        setNodes(data.nodes.map(n => ({
          id: n.id,
          type: 'claim',
          position: n.position,
          data: n,
        })));
        setEdges(data.edges.map(e => ({
          id: e.id,
          source: e.source_id,
          target: e.target_id,
          type: 'relationship',
          data: e,
          animated: e.relation_type === 'supports',
          style: {
            stroke: getEdgeColor(e.relation_type),
            strokeWidth: e.strength_score * 3,
          },
        })));
      });
  }, [uploadId, layout]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        
        {/* Custom controls panel */}
        <Panel position="top-left">
          <GraphFilters />
          <LayoutSelector value={layout} onChange={setLayout} />
        </Panel>
        
        {/* Search panel */}
        <Panel position="top-right">
          <GraphSearch onNodeSelect={setSelectedNode} />
        </Panel>
      </ReactFlow>
      
      {/* Inspector sidebar */}
      {selectedNode && (
        <ClaimInspector 
          claimId={selectedNode} 
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

function getEdgeColor(relationType: string): string {
  switch (relationType) {
    case 'supports': return '#22c55e';      // green
    case 'contradicts': return '#ef4444';   // red
    case 'extends': return '#3b82f6';       // blue
    case 'method_of': return '#a855f7';     // purple
    default: return '#94a3b8';              // gray
  }
}
```

### 3.3 Claim Node Component

```typescript
// components/claims-graph/graph/ClaimNode.tsx

interface ClaimNodeProps {
  data: {
    id: string;
    claim_text: string;
    claim_type: string;
    section: string;
    confidence_score: number;
    importance_score: number;
    evidence_count: number;
  };
  selected: boolean;
}

export function ClaimNode({ data, selected }: ClaimNodeProps) {
  const typeColors = {
    finding: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    method: 'bg-blue-50 border-blue-200 text-blue-900',
    hypothesis: 'bg-amber-50 border-amber-200 text-amber-900',
    limitation: 'bg-rose-50 border-rose-200 text-rose-900',
    future_work: 'bg-purple-50 border-purple-200 text-purple-900',
  };

  return (
    <div className={`
      w-64 p-3 rounded-lg border-2 shadow-sm transition-all
      ${typeColors[data.claim_type] || 'bg-gray-50 border-gray-200'}
      ${selected ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105' : ''}
    `}>
      {/* Claim type badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
          {data.claim_type}
        </span>
        <span className="text-[10px] text-gray-400">
          {data.section}
        </span>
      </div>
      
      {/* Claim text */}
      <p className="text-xs leading-relaxed line-clamp-4 mb-2">
        {data.claim_text}
      </p>
      
      {/* Confidence indicator */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-black/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-current opacity-50"
            style={{ width: `${data.confidence_score * 100}%` }}
          />
        </div>
        <span className="text-[9px] opacity-60">
          {Math.round(data.confidence_score * 100)}%
        </span>
      </div>
      
      {/* Connection handles for edges */}
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}
```

### 3.4 Natural Language Query

```typescript
// components/claims-graph/query/NaturalLanguageQuery.tsx

export function NaturalLanguageQuery({ uploadId, onResults }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedQueries = [
    "What are the main findings?",
    "Show me the methodology chain",
    "Find contradictions in the paper",
    "What supports hypothesis X?",
    "List all limitations",
  ];

  const handleQuery = async () => {
    setLoading(true);
    const res = await fetch(`/api/graph/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upload_id: uploadId, query }),
    });
    const data = await res.json();
    onResults(data);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-3">
      <div className="flex items-center gap-2 mb-2">
        <Search size={14} className="text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask about the claims..."
          className="flex-1 text-sm outline-none"
          onKeyDown={e => e.key === 'Enter' && handleQuery()}
        />
        <button
          onClick={handleQuery}
          disabled={loading}
          className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-md disabled:opacity-50"
        >
          {loading ? '...' : 'Ask'}
        </button>
      </div>
      
      {/* Suggested queries */}
      <div className="flex flex-wrap gap-1">
        {suggestedQueries.map(q => (
          <button
            key={q}
            onClick={() => { setQuery(q); handleQuery(); }}
            className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## Part 4: Advanced Features (Phase 2)

### 4.1 Cross-Paper Claim Comparison

```python
# Compare claims across multiple papers

@router.post("/graph/compare")
async def compare_papers(
    upload_ids: List[str],
    query: str  # "Compare methodology" or "Find agreeing findings"
):
    """
    Aggregate claims graph across multiple papers.
    Find:
    - Agreements (similar claims across papers)
    - Contradictions (opposing findings)
    - Citation chains (paper A cites paper B)
    """
```

### 4.2 PDF Highlighter Integration

```typescript
// When user clicks a claim, highlight it in the original PDF
// Using PDF.js or similar

export function PDFHighlighter({
  pdfUrl,
  highlightedClaim
}: {
  pdfUrl: string;
  highlightedClaim: Claim;
}) {
  // Render PDF with highlighted region
  // Scroll to claim location
  // Show claim context sidebar
}
```

### 4.3 Export Formats

```python
# Export graph to various formats

@router.get("/papers/{id}/export/gexf")
async def export_gexf(upload_id: str):
    """Export for Gephi network analysis"""

@router.get("/papers/{id}/export/cytoscape")
async def export_cytoscape(upload_id: str):
    """Export for Cytoscape"""

@router.get("/papers/{id}/export/markdown")
async def export_markdown(upload_id: str):
    """Export claims as structured markdown"""
```

---

## Part 5: Implementation Timeline

### Week 1: Foundation
- [ ] Database migrations (PaperUpload, PaperClaim, ClaimRelationship)
- [ ] PDF upload endpoint
- [ ] Basic text extraction

### Week 2: Claim Extraction
- [ ] Claim extraction service with LLM
- [ ] Claim classification (type, section)
- [ ] Embedding generation

### Week 3: Relationships
- [ ] Relationship detection algorithms
- [ ] Graph building pipeline
- [ ] Graph metrics calculation

### Week 4: API
- [ ] All API endpoints
- [ ] Graph query endpoint
- [ ] Testing & refinement

### Week 5: Frontend - Upload & Status
- [ ] Upload component
- [ ] Processing status UI
- [ ] Upload history

### Week 6: Frontend - Graph Visualization
- [ ] React Flow integration
- [ ] ClaimNode component
- [ ] Edge rendering with colors
- [ ] Graph layouts

### Week 7: Frontend - Inspector & Query
- [ ] Claim inspector sidebar
- [ ] Natural language query
- [ ] PDF highlighter integration

### Week 8: Polish
- [ ] Performance optimization
- [ ] Export features
- [ ] Bug fixes

---

## Part 6: Technical Considerations

### Performance
- **Embedding generation:** Batch process claims, use caching
- **Graph rendering:** Virtualization for papers with >100 claims
- **Query speed:** Pre-compute graph metrics, index embeddings

### Accuracy
- **Claim extraction:** Start with high-confidence extractions only (>0.7)
- **User validation:** Allow users to mark claims as invalid
- **Iterative improvement:** Use user feedback to fine-tune prompts

### Storage
- **PDFs:** Store in S3-compatible storage
- **Embeddings:** 1536 dims × 4 bytes × ~100 claims/paper = ~600KB per paper
- **Text:** Store extracted text for search/re-highlighting

### Costs (Estimated)
- **LLM calls:** ~$0.02-0.05 per paper (extraction + relationships)
- **Embeddings:** ~$0.001 per paper
- **Storage:** Negligible for academic use

---

## Summary

This feature transforms static PDFs into explorable knowledge graphs. Users can:

1. **Upload** any research paper PDF
2. **Explore** an interactive graph of its claims
3. **Query** in natural language ("What contradicts hypothesis X?")
4. **Validate** AI-extracted claims
5. **Compare** claims across multiple papers

The core value is making paper structure **visible and explorable**, helping researchers quickly understand:
- What are the main claims?
- How do they relate to each other?
- What's the evidence chain?
- Where are the limitations?

Want me to start implementing any specific part?