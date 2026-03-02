'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { memoryApi } from '@/lib/api';
import { useProject } from '../_context/project-context';
import type { Claim, ClaimCitationUsage, ClaimRelationship, ProvenanceClaim } from '@/lib/types';
import { relativeTime, truncate } from '@/lib/types';
import { ExternalLink, Link2, Network, RefreshCw, ChevronRight, FileText } from 'lucide-react';

export function ProvenanceTab() {
    const { projectId, provenance, provenanceLoading: loading, loadProvenance } = useProject();
    const [search, setSearch] = useState('');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [selectedClaim, setSelectedClaim] = useState<ProvenanceClaim | null>(null);
    const [relatedClaims, setRelatedClaims] = useState<Claim[]>([]);
    const [relationships, setRelationships] = useState<ClaimRelationship[]>([]);
    const [claimCitations, setClaimCitations] = useState<ClaimCitationUsage[]>([]);
    const [claimDetailsLoading, setClaimDetailsLoading] = useState(false);

    // Load on first mount if not already loaded
    useEffect(() => {
        if (!provenance && !loading) {
            void loadProvenance();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const sourceTypes = useMemo(() => {
        if (!provenance) return [];
        return Object.keys(provenance.summary.source_type_breakdown).sort();
    }, [provenance]);

    const filteredClaims = useMemo(() => {
        if (!provenance) return [];
        const needle = search.trim().toLowerCase();
        return provenance.claims.filter((claim) => {
            if (sourceFilter !== 'all' && claim.source_type !== sourceFilter) return false;
            if (!needle) return true;
            return (
                claim.claim_text.toLowerCase().includes(needle) ||
                claim.source_label.toLowerCase().includes(needle) ||
                (claim.claim_type || '').toLowerCase().includes(needle)
            );
        });
    }, [provenance, search, sourceFilter]);

    useEffect(() => {
        if (!selectedClaim && filteredClaims.length > 0) {
            setSelectedClaim(filteredClaims[0]);
        } else if (selectedClaim && !filteredClaims.find((claim) => claim.id === selectedClaim.id)) {
            setSelectedClaim(filteredClaims[0] ?? null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredClaims]);

    useEffect(() => {
        if (!selectedClaim) {
            setRelatedClaims([]);
            setRelationships([]);
            setClaimCitations([]);
            return;
        }

        let mounted = true;
        const loadClaimDetails = async () => {
            setClaimDetailsLoading(true);
            const [relatedRes, relRes, citeRes] = await Promise.all([
                memoryApi.getRelatedClaims(projectId, selectedClaim.id, 2),
                memoryApi.getClaimRelationships(projectId, selectedClaim.id),
                memoryApi.getClaimCitations(projectId, selectedClaim.id),
            ]);

            if (!mounted) return;
            setRelatedClaims(relatedRes.data || []);
            setRelationships(relRes.data || []);
            setClaimCitations(citeRes.data || []);
            setClaimDetailsLoading(false);
        };

        void loadClaimDetails();
        return () => {
            mounted = false;
        };
    }, [projectId, selectedClaim]);

    if (loading) {
        return (
            <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm flex items-center justify-center min-h-[200px]">
                <div className="flex items-center gap-2 text-gray-500">
                    <RefreshCw size={16} className="animate-spin" />
                    <span className="text-[13px] font-medium">Loading provenance data...</span>
                </div>
            </div>
        );
    }

    if (!provenance) {
        return (
            <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
                <p className="text-[13px] text-gray-500">Provenance is unavailable for this project.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Top Stats Overview */}
            <div className="rounded-xl border border-black/5 bg-white shadow-sm shrink-0">
                <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 bg-gray-50/50">
                    <h3 className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">Provenance Graph</h3>
                    <button
                        onClick={loadProvenance}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <RefreshCw size={12} /> Refresh Sync
                    </button>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <Metric label="Knowledge Claims" value={provenance.summary.total_claims} />
                        <Metric label="Mean Confidence" value={`${Math.round(provenance.summary.avg_claim_confidence * 100)}%`} />
                        <Metric label="Relational Edges" value={provenance.summary.total_relationships} />
                        <Metric label="Applied Citations" value={provenance.summary.total_claim_citations} />
                        <Metric label="Generated Artifacts" value={provenance.summary.total_artifacts} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {sourceTypes.map((type) => (
                            <span
                                key={type}
                                className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-black/5"
                            >
                                {type}: {provenance.summary.source_type_breakdown[type]}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Inspection View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
                {/* Left Panel: Claims Explorer */}
                <div className="rounded-xl border border-black/5 bg-white shadow-sm flex flex-col min-h-0 lg:col-span-1">
                    <div className="p-3 border-b border-black/5 bg-gray-50/50">
                        <div className="flex flex-col gap-2">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Filter claims..."
                                className="w-full bg-white rounded-lg border border-black/10 px-3 py-1.5 text-[12px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 shadow-sm"
                            />
                            <select
                                value={sourceFilter}
                                onChange={(e) => setSourceFilter(e.target.value)}
                                className="w-full bg-white rounded-lg border border-black/10 px-2.5 py-1.5 text-[12px] text-gray-700 focus:outline-none focus:border-blue-500 shadow-sm"
                            >
                                <option value="all">All sources</option>
                                {sourceTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {filteredClaims.length === 0 && (
                            <div className="text-center p-4">
                                <p className="text-[12px] text-gray-500">No claims match current filters.</p>
                            </div>
                        )}
                        <div className="space-y-1">
                            {filteredClaims.map((claim) => {
                                const isSelected = selectedClaim?.id === claim.id;
                                return (
                                    <button
                                        key={claim.id}
                                        onClick={() => setSelectedClaim(claim)}
                                        className={`w-full text-left rounded-lg px-3 py-2.5 transition-all outline-none border ${isSelected
                                            ? 'bg-blue-50/50 border-blue-200/60 shadow-sm'
                                            : 'border-transparent hover:bg-gray-50 hover:border-black/5'
                                            }`}
                                    >
                                        <p className={`text-[12px] font-medium line-clamp-2 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{claim.claim_text}</p>
                                        <div className="mt-1.5 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                <span className="font-semibold text-gray-500 uppercase tracking-wider">{claim.source_type}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                <span className={claim.confidence > 0.8 ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                                                    {Math.round(claim.confidence * 100)}% conf
                                                </span>
                                            </div>
                                            {isSelected && <ChevronRight size={14} className="text-blue-500" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Detail Inspector & Artifacts */}
                <div className="flex flex-col gap-4 lg:col-span-2 min-h-0">
                    <div className="rounded-xl border border-black/5 bg-white shadow-sm flex-1 overflow-y-auto custom-scrollbar">
                        <div className="px-4 py-3 border-b border-black/5 bg-gray-50/50 sticky top-0 z-10">
                            <h3 className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">Node Inspector</h3>
                        </div>
                        <div className="p-4">
                            {!selectedClaim ? (
                                <div className="h-full flex items-center justify-center text-[13px] text-gray-400">
                                    Select a claim to inspect its lineage and dependencies.
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* Primary Node Info */}
                                    <div>
                                        <p className="text-[13px] text-gray-900 leading-relaxed font-medium bg-gray-50 p-3 rounded-lg border border-black/5">{selectedClaim.claim_text}</p>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-gray-100 px-2 py-1 rounded-md text-gray-700 border border-black/5">
                                                <span className="uppercase tracking-wider opacity-60">Source</span>
                                                <span>{selectedClaim.source_type}</span>
                                            </div>
                                            <div className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md border ${selectedClaim.confidence > 0.8 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                <span>Confidence: {Math.round(selectedClaim.confidence * 100)}%</span>
                                            </div>
                                            <span className="text-[11px] text-gray-400 ml-auto">Indexed {relativeTime(selectedClaim.extracted_at)}</span>
                                        </div>

                                        <div className="mt-3 flex items-center gap-2 bg-blue-50/30 border border-blue-100 rounded-lg px-3 py-2 text-[12px]">
                                            <Link2 size={14} className="text-blue-500 shrink-0" />
                                            <span className="text-gray-700 font-medium truncate">{selectedClaim.source_label}</span>
                                            {selectedClaim.source_url && (
                                                <a href={selectedClaim.source_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 ml-auto shrink-0 font-medium">
                                                    Link <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Connected Entities Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Citations */}
                                        <div>
                                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <FileText size={12} /> Synthesized In
                                            </h4>
                                            {claimDetailsLoading ? (
                                                <p className="text-[12px] text-gray-400 animate-pulse">Loading vectors...</p>
                                            ) : claimCitations.length > 0 ? (
                                                <div className="space-y-1.5">
                                                    {claimCitations.map((citation) => (
                                                        <Link key={citation.citation_id} href={`/projects/${projectId}/doc/${citation.document_id}`} className="block">
                                                            <div className="text-[12px] rounded-lg bg-gray-50 hover:bg-white px-3 py-2 border border-black/5 hover:border-black/10 hover:shadow-sm transition-all group">
                                                                <span className="text-blue-600 font-medium group-hover:underline block truncate">{citation.document_title}</span>
                                                                <span className="text-[10px] text-gray-400 block mt-0.5">Referenced {relativeTime(citation.created_at)}</span>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-[12px] text-gray-400 italic bg-gray-50/50 border border-gray-100 rounded-lg p-2 text-center">Unused in current drafts</div>
                                            )}
                                        </div>

                                        {/* Related Edges */}
                                        <div>
                                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <Network size={12} /> Semantic Edges
                                            </h4>
                                            {claimDetailsLoading ? (
                                                <p className="text-[12px] text-gray-400 animate-pulse">Resolving edges...</p>
                                            ) : relationships.length > 0 ? (
                                                <div className="space-y-1.5">
                                                    {relationships.slice(0, 5).map((relationship) => (
                                                        <div key={relationship.id} className="flex flex-col rounded-lg border border-black/5 bg-white px-3 py-2 text-[12px] shadow-sm">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-semibold text-gray-700 capitalize">{relationship.relationship_type.replace('_', ' ')}</span>
                                                                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 rounded">{Math.round(relationship.strength * 100)}% link</span>
                                                            </div>
                                                            {/* Assuming relationship contains the target claim text in a real app, placeholder for now since types usually just have IDs */}
                                                            <span className="text-gray-500 text-[11px] truncate block opacity-70">Target node ID: {relationship.to_claim_id.slice(0, 8)}...</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-[12px] text-gray-400 italic bg-gray-50/50 border border-gray-100 rounded-lg p-2 text-center">No strong relational edges</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Artifact Lineage (Compact Bottom Panel) */}
                    <div className="rounded-xl border border-black/5 bg-white shadow-sm shrink-0">
                        <div className="px-4 py-2.5 border-b border-black/5 bg-gray-50/50">
                            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Artifact Trace Matrix</h3>
                        </div>
                        {provenance.artifacts.length === 0 ? (
                            <div className="p-4 text-center">
                                <p className="text-[12px] text-gray-400 italic">No artifacts generated in this operational context.</p>
                            </div>
                        ) : (
                            <div className="max-h-[160px] overflow-y-auto custom-scrollbar p-2">
                                <div className="space-y-1">
                                    {provenance.artifacts.map((artifact) => (
                                        <div key={artifact.artifact_id} className="flex items-center justify-between rounded-lg border border-transparent hover:border-black/5 hover:bg-gray-50 px-3 py-2 transition-colors">
                                            <div className="min-w-0 pr-4">
                                                <p className="text-[12px] font-medium text-gray-900 truncate">{artifact.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                                                    <span className="uppercase tracking-wider font-semibold">{artifact.artifact_type}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                    <span>Task: {artifact.task_name || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-[10px] text-gray-400">{relativeTime(artifact.created_at)}</p>
                                                {artifact.input_artifact_ids.length > 0 && (
                                                    <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{artifact.input_artifact_ids.length} Inputs</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg bg-gray-50 border border-black/5 p-3 flex flex-col justify-center">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1.5">{label}</p>
            <p className="text-[16px] font-semibold text-gray-900 leading-none truncate">{value}</p>
        </div>
    );
}
