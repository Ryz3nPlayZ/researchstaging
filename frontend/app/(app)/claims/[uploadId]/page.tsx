'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, AlertTriangle, GitGraph, Loader2,
  Filter, Download, MessageSquare
} from 'lucide-react';

// Types
interface Claim {
  id: string;
  text: string;
  quote: string;
  claim_type: 'fact' | 'claim' | 'assumption' | 'implication';
  section: string;
  confidence: number;
  importance_score: number;
}

interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  relationship_type: 'supports' | 'contradicts' | 'assumes' | 'implies' | 'method_of';
  confidence: number;
}

interface Contradiction {
  id: string;
  type: 'numerical' | 'logical' | 'semantic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  claim_1: { id: string; text: string; section: string };
  claim_2: { id: string; text: string; section: string };
}

interface GraphData {
  claims: Claim[];
  relationships: Relationship[];
  contradictions: Contradiction[];
}

export default function ClaimsGraphDetailPage() {
  const params = useParams();
  const uploadId = params.uploadId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GraphData | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [activeTab, setActiveTab] = useState<'graph' | 'contradictions' | 'list'>('graph');
  const [filter, setFilter] = useState({
    type: 'all',
    section: 'all',
    minConfidence: 0.5
  });

  useEffect(() => {
    loadGraphData();
  }, [uploadId]);

  const loadGraphData = async () => {
    try {
      const res = await fetch(`/api/claims-graph/uploads/${uploadId}/graph`);
      if (res.ok) {
        const result = await res.json();
        setData(result.data);
      }
    } catch (e) {
      console.error('Failed to load graph:', e);
    } finally {
      setLoading(false);
    }
  };

  // Filter claims
  const filteredClaims = data?.claims.filter(c => {
    if (filter.type !== 'all' && c.claim_type !== filter.type) return false;
    if (filter.section !== 'all' && c.section !== filter.section) return false;
    if (c.confidence < filter.minConfidence) return false;
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Failed to load claims graph</p>
          <Link href="/claims" className="text-indigo-600 hover:underline mt-2 inline-block">
            ← Back to Claims
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/claims"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Claims Graph</h1>
                <p className="text-sm text-gray-500">
                  {data.claims.length} claims • {data.relationships.length} relationships
                  {data.contradictions.length > 0 && (
                    <span className="text-red-600 ml-2">
                      • {data.contradictions.length} contradictions
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'graph'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <GitGraph className="w-4 h-4 inline mr-1" />
                Graph
              </button>
              <button
                onClick={() => setActiveTab('contradictions')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'contradictions'
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Issues
                {data.contradictions.length > 0 && (
                  <span className="ml-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs">
                    {data.contradictions.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'list'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>

            <select
              value={filter.type}
              onChange={(e) => setFilter(f => ({ ...f, type: e.target.value }))}
              className="text-sm border rounded-lg px-3 py-1.5"
            >
              <option value="all">All Types</option>
              <option value="fact">Facts</option>
              <option value="claim">Claims</option>
              <option value="assumption">Assumptions</option>
              <option value="implication">Implications</option>
            </select>

            <select
              value={filter.section}
              onChange={(e) => setFilter(f => ({ ...f, section: e.target.value }))}
              className="text-sm border rounded-lg px-3 py-1.5"
            >
              <option value="all">All Sections</option>
              <option value="abstract">Abstract</option>
              <option value="intro">Introduction</option>
              <option value="methods">Methods</option>
              <option value="results">Results</option>
              <option value="discussion">Discussion</option>
              <option value="conclusion">Conclusion</option>
            </select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Min Confidence:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filter.minConfidence}
                onChange={(e) => setFilter(f => ({ ...f, minConfidence: parseFloat(e.target.value) }))}
                className="w-24"
              />
              <span className="text-sm text-gray-900 w-12">{Math.round(filter.minConfidence * 100)}%</span>
            </div>

            <div className="ml-auto text-sm text-gray-500">
              Showing {filteredClaims.length} of {data.claims.length} claims
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'graph' && (
              <GraphVisualization
                claims={filteredClaims}
                relationships={data.relationships}
                onSelectClaim={setSelectedClaim}
                selectedClaimId={selectedClaim?.id}
              />
            )}

            {activeTab === 'contradictions' && (
              <ContradictionsPanel
                contradictions={data.contradictions}
                onSelectClaim={setSelectedClaim}
              />
            )}

            {activeTab === 'list' && (
              <ClaimsList
                claims={filteredClaims}
                onSelect={setSelectedClaim}
                selectedId={selectedClaim?.id}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {selectedClaim ? (
              <ClaimInspector
                claim={selectedClaim}
                uploadId={uploadId}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center text-gray-500">
                <GitGraph className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a claim to view details</p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Claims</span>
                  <span className="font-medium">{data.claims.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Relationships</span>
                  <span className="font-medium">{data.relationships.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Contradictions</span>
                  <span className={`font-medium ${data.contradictions.length > 0 ? 'text-red-600' : ''}`}>
                    {data.contradictions.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Graph Visualization Component
function GraphVisualization({
  claims,
  relationships,
  onSelectClaim,
  selectedClaimId
}: {
  claims: Claim[];
  relationships: Relationship[];
  onSelectClaim: (c: Claim) => void;
  selectedClaimId?: string;
}) {
  // Simple list view for now - can be enhanced with React Flow
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Claim Relationships</h3>

      {claims.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No claims match the current filters</p>
      ) : (
        <div className="space-y-4">
          {claims.map(claim => {
            const related = relationships.filter(r =>
              r.source_id === claim.id || r.target_id === claim.id
            );

            return (
              <div
                key={claim.id}
                onClick={() => onSelectClaim(claim)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedClaimId === claim.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ClaimTypeBadge type={claim.claim_type} />
                    <span className="text-xs text-gray-500">{claim.section}</span>
                  </div>
                  <ConfidenceBadge confidence={claim.confidence} />
                </div>

                <p className="text-sm text-gray-900 mb-2 line-clamp-2">{claim.text}</p>

                {related.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <GitGraph className="w-3 h-3" />
                    {related.length} relationship{related.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Contradictions Panel
function ContradictionsPanel({
  contradictions,
  onSelectClaim
}: {
  contradictions: Contradiction[];
  onSelectClaim: (c: Claim) => void;
}) {
  if (contradictions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No Contradictions Found</h3>
        <p className="text-gray-500 mt-2">
          The AI did not detect any contradictions in this paper.
        </p>
      </div>
    );
  }

  const severityColors = {
    low: 'bg-yellow-50 border-yellow-200',
    medium: 'bg-orange-50 border-orange-200',
    high: 'bg-red-50 border-red-200',
    critical: 'bg-red-100 border-red-300'
  };

  const severityText = {
    low: 'text-yellow-800',
    medium: 'text-orange-800',
    high: 'text-red-800',
    critical: 'text-red-900 font-bold'
  };

  return (
    <div className="space-y-4">
      {contradictions.map(contra => (
        <div
          key={contra.id}
          className={`rounded-lg border p-4 ${severityColors[contra.severity]}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className={`w-5 h-5 ${severityText[contra.severity]}`} />
            <span className={`text-sm uppercase font-semibold ${severityText[contra.severity]}`}>
              {contra.severity} Severity
            </span>
            <span className="text-xs text-gray-500 ml-2">({contra.type})</span>
          </div>

          <p className="text-sm text-gray-700 mb-4">{contra.explanation}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/50 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">{contra.claim_1.section}</div>
              <p className="text-sm text-gray-900 line-clamp-3">{contra.claim_1.text}</p>
            </div>
            <div className="bg-white/50 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">{contra.claim_2.section}</div>
              <p className="text-sm text-gray-900 line-clamp-3">{contra.claim_2.text}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Claims List
function ClaimsList({
  claims,
  onSelect,
  selectedId
}: {
  claims: Claim[];
  onSelect: (c: Claim) => void;
  selectedId?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {claims.map((claim, i) => (
        <div
          key={claim.id}
          onClick={() => onSelect(claim)}
          className={`p-4 cursor-pointer transition-colors ${
            i !== claims.length - 1 ? 'border-b' : ''
          } ${selectedId === claim.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ClaimTypeBadge type={claim.claim_type} />
                <span className="text-xs text-gray-500">{claim.section}</span>
              </div>
              <p className="text-sm text-gray-900">{claim.text}</p>
            </div>
            <ConfidenceBadge confidence={claim.confidence} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Claim Inspector Sidebar
function ClaimInspector({ claim, uploadId }: { claim: Claim; uploadId: string }) {
  const [chain, setChain] = useState<any>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);

  useEffect(() => {
    // Load evidence chain
    fetch(`/api/claims-graph/claims/${claim.id}/chain?direction=both`)
      .then(r => r.json())
      .then(data => setChain(data.data));

    // Load annotations
    fetch(`/api/claims-graph/annotations?upload_id=${uploadId}&claim_id=${claim.id}`)
      .then(r => r.json())
      .then(data => setAnnotations(data.data || []));
  }, [claim.id, uploadId]);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2 mb-1">
          <ClaimTypeBadge type={claim.claim_type} />
          <span className="text-xs text-gray-500">{claim.section}</span>
        </div>
        <h3 className="font-semibold text-gray-900">Claim Details</h3>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">Text</label>
          <p className="text-sm text-gray-900 mt-1">{claim.text}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">Original Quote</label>
          <blockquote className="text-sm text-gray-600 mt-1 italic border-l-2 border-gray-300 pl-3">
            "{claim.quote}"
          </blockquote>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Confidence</label>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500"
                  style={{ width: `${claim.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">{Math.round(claim.confidence * 100)}%</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Importance</label>
            <div className="text-sm font-medium mt-1">
              {claim.importance_score.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Evidence Chain Preview */}
        {chain && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Evidence Chain</label>
            <div className="mt-2 space-y-2">
              {chain.upstream?.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-500">Supported by:</span>
                  <span className="ml-2 text-indigo-600">{chain.upstream.length} claims</span>
                </div>
              )}
              {chain.downstream?.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-500">Supports:</span>
                  <span className="ml-2 text-indigo-600">{chain.downstream.length} claims</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Annotations */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Annotations
            </label>
            <button className="text-xs text-indigo-600 hover:text-indigo-700">
              + Add
            </button>
          </div>

          {annotations.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No annotations yet</p>
          ) : (
            <div className="space-y-2">
              {annotations.map(anno => (
                <div key={anno.id} className="text-sm bg-gray-50 rounded p-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <span className="font-medium">{anno.user_name}</span>
                    <span>•</span>
                    <span>{anno.annotation_type}</span>
                  </div>
                  <p className="text-gray-700">{anno.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ClaimTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    fact: 'bg-emerald-100 text-emerald-700',
    claim: 'bg-blue-100 text-blue-700',
    assumption: 'bg-amber-100 text-amber-700',
    implication: 'bg-purple-100 text-purple-700'
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
      {type}
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const color = confidence >= 0.8 ? 'text-green-600 bg-green-50' :
                confidence >= 0.6 ? 'text-yellow-600 bg-yellow-50' :
                'text-red-600 bg-red-50';

  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${color}`}>
      {Math.round(confidence * 100)}%
    </span>
  );
}

// Icons
function CheckCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}
