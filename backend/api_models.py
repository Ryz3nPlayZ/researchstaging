"""
Pydantic models for Memory API requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class ClaimRequest(BaseModel):
    """Request model for creating a claim."""
    claim_text: str = Field(..., description="The claim statement")
    claim_type: Optional[str] = Field(None, description="Type of claim")
    claim_data: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    source_type: str = Field(..., description="Type of source (paper, file, analysis, user)")
    source_id: str = Field(..., description="ID of the source")
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="Extraction confidence")


class ExtractClaimsRequest(BaseModel):
    """Request model for extracting claims from a paper PDF."""
    paper_id: str = Field(..., description="External paper ID (Semantic Scholar, arXiv)")
    pdf_url: str = Field(..., description="URL to download PDF")
    paper_metadata: Dict[str, Any] = Field(..., description="Paper metadata (title, authors, year, etc.)")
    max_claims: int = Field(default=20, ge=1, le=50, description="Maximum number of claims to extract")


class ClaimResponse(BaseModel):
    """Response model for a claim."""
    id: str
    project_id: str
    claim_text: str
    claim_type: Optional[str]
    claim_data: Dict[str, Any]
    source_type: str
    source_id: str
    confidence: float
    relevance_score: Optional[float]
    extracted_at: datetime
    extracted_by: Optional[str]

    class Config:
        from_attributes = True


class FindingRequest(BaseModel):
    """Request model for creating a finding."""
    finding_text: str = Field(..., description="The finding statement")
    finding_type: Optional[str] = Field(None, description="Type of finding")
    finding_data: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    source_analysis_id: str = Field(..., description="ID of the analysis")
    analysis_type: str = Field(..., description="Type of analysis")
    significance: Optional[float] = Field(None, description="Significance metric")


class FindingResponse(BaseModel):
    """Response model for a finding."""
    id: str
    project_id: str
    finding_text: str
    finding_type: Optional[str]
    finding_data: Dict[str, Any]
    source_analysis_id: str
    analysis_type: str
    significance: Optional[float]
    relevance_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class PreferenceRequest(BaseModel):
    """Request model for setting a preference."""
    key: str = Field(..., description="Preference key")
    value: Any = Field(..., description="Preference value (JSON)")
    category: Optional[str] = Field(None, description="Preference category")


class PreferenceResponse(BaseModel):
    """Response model for a preference."""
    id: str
    project_id: str
    key: str
    value: Any
    category: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClaimRelationshipResponse(BaseModel):
    """Response model for a claim relationship."""
    id: str
    project_id: str
    from_claim_id: str
    to_claim_id: str
    relationship_type: str
    strength: float
    metadata: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentCitationRequest(BaseModel):
    """Request model for creating a document citation."""
    source_type: str = Field(..., description="Type of source (paper, claim, manual)")
    source_id: Optional[str] = Field(None, description="ID of the source (for paper/claim)")
    citation_data: Optional[Dict[str, Any]] = Field(None, description="Citation data (for manual type)")
    citation_position: Optional[Dict[str, int]] = Field(None, description="TipTap position in document")


class DocumentCitationResponse(BaseModel):
    """Response model for a document citation."""
    id: str
    document_id: str
    citation_position: Optional[Dict[str, int]]
    source_type: str
    source_id: Optional[str]
    citation_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class ProvenanceClaimResponse(BaseModel):
    """Claim row enriched with resolved source metadata."""
    id: str
    claim_text: str
    claim_type: Optional[str]
    source_type: str
    source_id: str
    confidence: float
    relevance_score: Optional[float]
    extracted_at: datetime
    source_label: str
    source_url: Optional[str]
    source_exists: bool
    relationship_count: int
    cited_in_documents: int


class ProvenanceArtifactResponse(BaseModel):
    """Artifact lineage row for provenance timeline."""
    artifact_id: str
    artifact_type: str
    title: str
    created_at: datetime
    task_id: Optional[str]
    task_name: Optional[str]
    run_id: Optional[str]
    parent_artifact_id: Optional[str]
    parent_artifact_title: Optional[str]
    input_artifact_ids: List[str]


class ProjectProvenanceSummaryResponse(BaseModel):
    """High-level provenance coverage metrics for a project."""
    total_claims: int
    avg_claim_confidence: float
    total_relationships: int
    total_claim_citations: int
    total_artifacts: int
    source_type_breakdown: Dict[str, int]


class ProjectProvenanceResponse(BaseModel):
    """Project provenance snapshot combining claims and artifact lineage."""
    summary: ProjectProvenanceSummaryResponse
    claims: List[ProvenanceClaimResponse]
    artifacts: List[ProvenanceArtifactResponse]


class ClaimCitationUsageResponse(BaseModel):
    """Document usage for a given claim citation."""
    citation_id: str
    document_id: str
    document_title: str
    created_at: datetime
