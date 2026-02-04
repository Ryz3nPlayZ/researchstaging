"""
Memory service for managing research claims, findings, and preferences.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from datetime import datetime, timezone
import json

from database.models import (
    Claim, Finding, Preference, ClaimRelationship,
    ClaimSourceType, RelationshipType
)
from llm_service import LLMService


class ClaimCreationError(Exception):
    """Raised when claim creation fails."""
    pass


class MemoryService:
    """Service for managing research memory (claims, findings, preferences)."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.llm_service = LLMService()

    async def create_claim(
        self,
        project_id: str,
        claim_text: str,
        source_type: ClaimSourceType,
        source_id: str,
        claim_type: Optional[str] = None,
        claim_data: Optional[Dict[str, Any]] = None,
        confidence: float = 0.0,
        extracted_by: Optional[str] = None,
    ) -> Claim:
        """
        Create a new claim with provenance tracking.

        Args:
            project_id: Project this claim belongs to
            claim_text: The claim statement
            source_type: Type of source (paper, file, analysis, user)
            source_id: ID of the source
            claim_type: Type of claim (assertion, fact, finding, hypothesis)
            claim_data: Additional metadata about the claim
            confidence: Extraction confidence (0.0 to 1.0)
            extracted_by: User or system ID that extracted this claim

        Returns:
            Created Claim object
        """
        claim = Claim(
            project_id=project_id,
            claim_text=claim_text,
            claim_type=claim_type,
            claim_data=claim_data or {},
            source_type=source_type,
            source_id=source_id,
            confidence=confidence,
            extracted_at=datetime.now(timezone.utc),
            extracted_by=extracted_by,
        )

        self.session.add(claim)
        await self.session.flush()

        return claim

    async def get_claim(self, claim_id: str) -> Optional[Claim]:
        """Retrieve a claim by ID."""
        result = await self.session.execute(
            select(Claim).where(Claim.id == claim_id)
        )
        return result.scalar_one_or_none()

    async def list_claims(
        self,
        project_id: str,
        source_type: Optional[ClaimSourceType] = None,
        source_id: Optional[str] = None,
        min_confidence: float = 0.0,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Claim]:
        """
        List claims with optional filters.

        Args:
            project_id: Project to scope to
            source_type: Filter by source type
            source_id: Filter by specific source ID
            min_confidence: Minimum confidence threshold
            limit: Max results to return
            offset: Pagination offset

        Returns:
            List of Claim objects
        """
        query = select(Claim).where(Claim.project_id == project_id)

        if source_type:
            query = query.where(Claim.source_type == source_type)
        if source_id:
            query = query.where(Claim.source_id == source_id)
        if min_confidence > 0:
            query = query.where(Claim.confidence >= min_confidence)

        query = query.order_by(Claim.relevance_score.desc().nulls_last())
        query = query.limit(limit).offset(offset)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update_claim(
        self,
        claim_id: str,
        claim_text: Optional[str] = None,
        claim_type: Optional[str] = None,
        claim_data: Optional[Dict[str, Any]] = None,
        relevance_score: Optional[float] = None,
    ) -> Optional[Claim]:
        """Update claim fields."""
        claim = await self.get_claim(claim_id)
        if not claim:
            return None

        if claim_text is not None:
            claim.claim_text = claim_text
        if claim_type is not None:
            claim.claim_type = claim_type
        if claim_data is not None:
            claim.claim_data = claim_data
        if relevance_score is not None:
            claim.relevance_score = relevance_score

        await self.session.flush()
        return claim

    async def delete_claim(self, claim_id: str) -> bool:
        """Delete a claim."""
        claim = await self.get_claim(claim_id)
        if not claim:
            return False

        await self.session.delete(claim)
        await self.session.flush()
        return True

    async def create_finding(
        self,
        project_id: str,
        finding_text: str,
        source_analysis_id: str,
        analysis_type: str,
        finding_type: Optional[str] = None,
        finding_data: Optional[Dict[str, Any]] = None,
        significance: Optional[float] = None,
    ) -> Finding:
        """Create a new finding from analysis results."""
        finding = Finding(
            project_id=project_id,
            finding_text=finding_text,
            finding_type=finding_type,
            finding_data=finding_data or {},
            source_analysis_id=source_analysis_id,
            analysis_type=analysis_type,
            significance=significance,
            created_at=datetime.now(timezone.utc),
        )

        self.session.add(finding)
        await self.session.flush()

        return finding

    async def get_finding(self, finding_id: str) -> Optional[Finding]:
        """Retrieve a finding by ID."""
        result = await self.session.execute(
            select(Finding).where(Finding.id == finding_id)
        )
        return result.scalar_one_or_none()

    async def list_findings(
        self,
        project_id: str,
        source_analysis_id: Optional[str] = None,
        analysis_type: Optional[str] = None,
        min_significance: Optional[float] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Finding]:
        """List findings with optional filters."""
        query = select(Finding).where(Finding.project_id == project_id)

        if source_analysis_id:
            query = query.where(Finding.source_analysis_id == source_analysis_id)
        if analysis_type:
            query = query.where(Finding.analysis_type == analysis_type)
        if min_significance is not None:
            query = query.where(Finding.significance >= min_significance)

        query = query.order_by(Finding.significance.desc().nulls_last())
        query = query.limit(limit).offset(offset)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update_finding(
        self,
        finding_id: str,
        finding_text: Optional[str] = None,
        finding_type: Optional[str] = None,
        finding_data: Optional[Dict[str, Any]] = None,
        significance: Optional[float] = None,
        relevance_score: Optional[float] = None,
    ) -> Optional[Finding]:
        """Update finding fields."""
        finding = await self.get_finding(finding_id)
        if not finding:
            return None

        if finding_text is not None:
            finding.finding_text = finding_text
        if finding_type is not None:
            finding.finding_type = finding_type
        if finding_data is not None:
            finding.finding_data = finding_data
        if significance is not None:
            finding.significance = significance
        if relevance_score is not None:
            finding.relevance_score = relevance_score

        await self.session.flush()
        return finding

    async def delete_finding(self, finding_id: str) -> bool:
        """Delete a finding."""
        finding = await self.get_finding(finding_id)
        if not finding:
            return False

        await self.session.delete(finding)
        await self.session.flush()
        return True

    async def get_claims_by_source(
        self,
        source_type: ClaimSourceType,
        source_id: str,
    ) -> List[Claim]:
        """Get all claims from a specific source."""
        result = await self.session.execute(
            select(Claim).where(
                and_(
                    Claim.source_type == source_type,
                    Claim.source_id == source_id
                )
            )
        )
        return list(result.scalars().all())

    async def set_preference(
        self,
        project_id: str,
        key: str,
        value: Any,
        category: Optional[str] = None,
    ) -> Preference:
        """Set or update a project preference."""
        # Check if preference exists
        result = await self.session.execute(
            select(Preference).where(
                and_(
                    Preference.project_id == project_id,
                    Preference.key == key
                )
            )
        )
        pref = result.scalar_one_or_none()

        if pref:
            # Update existing
            pref.value = value
            pref.category = category
            pref.updated_at = datetime.now(timezone.utc)
        else:
            # Create new
            pref = Preference(
                project_id=project_id,
                key=key,
                value=value,
                category=category,
            )
            self.session.add(pref)

        await self.session.flush()
        return pref

    async def get_preference(
        self,
        project_id: str,
        key: str,
    ) -> Optional[Preference]:
        """Get a project preference by key."""
        result = await self.session.execute(
            select(Preference).where(
                and_(
                    Preference.project_id == project_id,
                    Preference.key == key
                )
            )
        )
        return result.scalar_one_or_none()

    async def list_preferences(
        self,
        project_id: str,
        category: Optional[str] = None,
    ) -> List[Preference]:
        """List project preferences, optionally by category."""
        query = select(Preference).where(Preference.project_id == project_id)

        if category:
            query = query.where(Preference.category == category)

        query = query.order_by(Preference.key)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def delete_preference(self, project_id: str, key: str) -> bool:
        """Delete a project preference."""
        pref = await self.get_preference(project_id, key)
        if not pref:
            return False

        await self.session.delete(pref)
        await self.session.flush()
        return True

    async def create_claim_relationship(
        self,
        project_id: str,
        from_claim_id: str,
        to_claim_id: str,
        relationship_type: RelationshipType,
        strength: float = 0.5,
        relationship_metadata: Optional[Dict[str, Any]] = None,
    ) -> ClaimRelationship:
        """Create a relationship between two claims."""
        relationship = ClaimRelationship(
            project_id=project_id,
            from_claim_id=from_claim_id,
            to_claim_id=to_claim_id,
            relationship_type=relationship_type,
            strength=strength,
            relationship_metadata=relationship_metadata or {},
        )

        self.session.add(relationship)
        await self.session.flush()

        return relationship

    async def get_related_claims(
        self,
        claim_id: str,
        relationship_type: Optional[RelationshipType] = None,
        max_depth: int = 2,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Get claims related to the given claim using graph traversal.

        Args:
            claim_id: Starting claim ID
            relationship_type: Filter by relationship type (optional)
            max_depth: Maximum traversal depth
            limit: Maximum number of claims to return

        Returns:
            List of dicts with claim, relationship, and depth info
        """
        # Build recursive CTE query
        from sqlalchemy import text

        if relationship_type:
            type_filter = f"AND cr.relationship_type = '{relationship_type.value}'"
        else:
            type_filter = ""

        query = f"""
        WITH RECURSIVE related_claims AS (
            -- Base case: direct relationships
            SELECT
                c.id,
                c.claim_text,
                c.claim_type,
                c.source_type,
                c.source_id,
                c.confidence,
                c.relevance_score,
                cr.relationship_type,
                cr.strength,
                1 as depth,
                ARRAY[c.id] as path
            FROM claims c
            JOIN claim_relationships cr ON c.id = cr.to_claim_id
            WHERE cr.from_claim_id = :claim_id {type_filter}

            UNION ALL

            -- Recursive case: follow relationships
            SELECT
                c.id,
                c.claim_text,
                c.claim_type,
                c.source_type,
                c.source_id,
                c.confidence,
                c.relevance_score,
                cr.relationship_type,
                cr.strength,
                rc.depth + 1,
                rc.path || c.id
            FROM claims c
            JOIN claim_relationships cr ON c.id = cr.to_claim_id
            JOIN related_claims rc ON cr.from_claim_id = rc.id
            WHERE
                rc.depth < :max_depth
                AND c.id != ALL(rc.path)  -- Prevent cycles
                {type_filter}
        )
        SELECT * FROM related_claims
        ORDER BY depth, strength DESC
        LIMIT :limit
        """

        result = await self.session.execute(
            text(query),
            {"claim_id": claim_id, "max_depth": max_depth, "limit": limit}
        )

        rows = result.fetchall()

        return [
            {
                "claim_id": row.id,
                "claim_text": row.claim_text,
                "claim_type": row.claim_type,
                "source_type": row.source_type,
                "source_id": row.source_id,
                "confidence": row.confidence,
                "relevance_score": row.relevance_score,
                "relationship_type": row.relationship_type,
                "strength": row.strength,
                "depth": row.depth,
            }
            for row in rows
        ]

    async def extract_claims_from_paper(
        self,
        project_id: str,
        paper_id: str,
        title: str,
        abstract: Optional[str] = None,
        full_text: Optional[str] = None,
        model: str = "gpt-4",
    ) -> List[Claim]:
        """
        Extract research claims from a paper using LLM.

        Args:
            project_id: Project to associate claims with
            paper_id: ID of the paper
            title: Paper title
            abstract: Paper abstract
            full_text: Full paper text (optional, more claims if provided)
            model: LLM model to use for extraction

        Returns:
            List of extracted Claim objects
        """
        # Load extraction prompt
        prompt = self._load_claim_extraction_prompt()

        # Prepare input text
        paper_content = f"Title: {title}\n"
        if abstract:
            paper_content += f"Abstract: {abstract}\n"
        if full_text:
            # Truncate full text if too long
            paper_content += f"Full Text: {full_text[:10000]}\n"

        # Extract claims using LLM
        response = await self.llm_service.generate(
            prompt=prompt.format(paper_content=paper_content),
            system_message="You are a research assistant extracting testable claims from academic papers.",
            provider="openai" if "openai" in self.llm_service.available_providers else None,
        )

        # Parse JSON response
        claims_data = self._parse_json_response(response)

        # Create Claim objects
        claims = []
        for claim_data in claims_data.get("claims", []):
            claim = await self.create_claim(
                project_id=project_id,
                claim_text=claim_data["claim_text"],
                claim_type=claim_data.get("claim_type"),
                claim_data=claim_data.get("metadata", {}),
                source_type=ClaimSourceType.PAPER,
                source_id=paper_id,
                confidence=claim_data.get("confidence", 0.8),
            )
            claims.append(claim)

        return claims

    async def extract_claims_from_papers(
        self,
        project_id: str,
        papers: List[Dict[str, Any]],
        model: str = "gpt-4",
    ) -> Dict[str, List[Claim]]:
        """
        Batch extract claims from multiple papers.

        Args:
            project_id: Project to associate claims with
            papers: List of paper dicts with id, title, abstract, full_text
            model: LLM model to use

        Returns:
            Dict mapping paper_id to list of extracted Claims
        """
        results = {}

        # Process in batches of 5 papers to avoid token limits
        batch_size = 5
        for i in range(0, len(papers), batch_size):
            batch = papers[i:i + batch_size]

            # Format batch for LLM
            batch_content = ""
            for paper in batch:
                batch_content += f"\n--- Paper ID: {paper['id']} ---\n"
                batch_content += f"Title: {paper['title']}\n"
                if paper.get("abstract"):
                    batch_content += f"Abstract: {paper['abstract']}\n"

            # Extract claims for batch
            prompt = self._load_batch_claim_extraction_prompt()
            response = await self.llm_service.generate(
                prompt=prompt.format(papers_batch=batch_content),
                system_message="You are a research assistant extracting testable claims from academic papers.",
                provider="openai" if "openai" in self.llm_service.available_providers else None,
            )

            # Parse JSON response
            claims_data = self._parse_json_response(response)

            # Organize claims by paper
            for claim_item in claims_data.get("paper_claims", []):
                paper_id = claim_item["paper_id"]
                claims = []

                for claim_data in claim_item.get("claims", []):
                    claim = await self.create_claim(
                        project_id=project_id,
                        claim_text=claim_data["claim_text"],
                        claim_type=claim_data.get("claim_type"),
                        claim_data=claim_data.get("metadata", {}),
                        source_type=ClaimSourceType.PAPER,
                        source_id=paper_id,
                        confidence=claim_data.get("confidence", 0.8),
                    )
                    claims.append(claim)

                results[paper_id] = claims

        return results

    def _load_claim_extraction_prompt(self) -> str:
        """Load claim extraction prompt template."""
        try:
            with open("backend/prompts/extract_claims.txt", "r") as f:
                return f.read()
        except FileNotFoundError:
            # Return default prompt if file doesn't exist yet
            return """Extract the most important, testable claims from the following paper. Focus on:
- Primary hypotheses or research questions
- Key findings that contribute new knowledge
- Assertions about causal relationships or correlations
- Claims about methodology effectiveness
- Conclusions supported by evidence

For each claim, provide:
1. claim_text: The exact claim statement (1-2 sentences)
2. claim_type: One of: assertion, fact, finding, hypothesis
3. confidence: How confident you are this is a core claim (0.5-1.0)
4. metadata: Additional context (methodology, sample_size, p_value if applicable)

Return only significant claims (5-10 max). Format as JSON:

{{
  "claims": [
    {{
      "claim_text": "Regular exercise reduces risk of cardiovascular disease by 30%",
      "claim_type": "finding",
      "confidence": 0.95,
      "metadata": {{
        "methodology": "meta-analysis",
        "sample_size": 50000,
        "p_value": "<0.001"
      }}
    }}
  ]
}}

Paper to analyze:
{paper_content}
"""

    def _load_batch_claim_extraction_prompt(self) -> str:
        """Load batch claim extraction prompt template."""
        try:
            with open("backend/prompts/extract_claims_batch.txt", "r") as f:
                return f.read()
        except FileNotFoundError:
            # Return default prompt if file doesn't exist yet
            return """Extract the most important claim from each paper (1-2 claims per paper max).

For each claim, provide:
1. paper_id: The ID of the paper
2. claim_text: The claim statement
3. claim_type: One of: assertion, fact, finding, hypothesis
4. confidence: 0.5-1.0

Format as JSON:

{{
  "paper_claims": [
    {{
      "paper_id": "{paper_id}",
      "claims": [
        {{
          "claim_text": "...",
          "claim_type": "finding",
          "confidence": 0.9
        }}
      ]
    }}
  ]
}}

Papers to analyze:
{papers_batch}
"""

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON from LLM response with fallback."""
        import json
        try:
            # Try to extract JSON from response
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(response[start:end])
        except (json.JSONDecodeError, ValueError) as e:
            # Return empty dict if parsing fails
            return {"claims": [], "paper_claims": []}
        return {"claims": [], "paper_claims": []}

    async def extract_findings_from_analysis(
        self,
        project_id: str,
        source_analysis_id: str,
        analysis_type: str,
        analysis_output: Dict[str, Any],
    ) -> List[Finding]:
        """
        Extract findings from analysis results.

        Args:
            project_id: Project to associate findings with
            source_analysis_id: ID of the analysis task/artifact
            analysis_type: Type of analysis (r_analysis, python_analysis)
            analysis_output: Analysis output dict

        Returns:
            List of extracted Finding objects
        """
        findings = []

        # Extract statistical findings
        if "p_value" in analysis_output:
            finding = await self.create_finding(
                project_id=project_id,
                finding_text=f"Statistical test result with p-value: {analysis_output['p_value']}",
                finding_type="statistical",
                source_analysis_id=source_analysis_id,
                analysis_type=analysis_type,
                finding_data={
                    "p_value": analysis_output["p_value"],
                    "test_statistic": analysis_output.get("test_statistic"),
                    "test_type": analysis_output.get("test_type"),
                },
                significance=float(analysis_output["p_value"]) if analysis_output["p_value"] else None,
            )
            findings.append(finding)

        # Extract pattern findings
        if "patterns" in analysis_output:
            for pattern in analysis_output["patterns"]:
                finding = await self.create_finding(
                    project_id=project_id,
                    finding_text=pattern.get("description", str(pattern)),
                    finding_type="pattern",
                    source_analysis_id=source_analysis_id,
                    analysis_type=analysis_type,
                    finding_data=pattern,
                    significance=pattern.get("confidence"),
                )
                findings.append(finding)

        # Extract insight findings
        if "insights" in analysis_output:
            for insight in analysis_output["insights"]:
                finding = await self.create_finding(
                    project_id=project_id,
                    finding_text=insight.get("text", str(insight)),
                    finding_type="insight",
                    source_analysis_id=source_analysis_id,
                    analysis_type=analysis_type,
                    finding_data=insight,
                    significance=insight.get("confidence"),
                )
                findings.append(finding)

        # Extract correlation findings
        if "correlations" in analysis_output:
            for corr in analysis_output["correlations"]:
                var1 = corr.get("var1", "unknown")
                var2 = corr.get("var2", "unknown")
                coeff = corr.get("coefficient", 0)
                p_val = corr.get("p_value")

                finding_text = f"Correlation between {var1} and {var2}: {coeff:.3f}"
                if p_val:
                    finding_text += f" (p={p_val})"

                finding = await self.create_finding(
                    project_id=project_id,
                    finding_text=finding_text,
                    finding_type="correlation",
                    source_analysis_id=source_analysis_id,
                    analysis_type=analysis_type,
                    finding_data=corr,
                    significance=p_val,
                )
                findings.append(finding)

        # Extract model performance findings
        if "model_performance" in analysis_output:
            perf = analysis_output["model_performance"]
            metrics_text = ", ".join([f"{k}: {v}" for k, v in perf.items()])

            finding = await self.create_finding(
                project_id=project_id,
                finding_text=f"Model performance metrics: {metrics_text}",
                finding_type="model_performance",
                source_analysis_id=source_analysis_id,
                analysis_type=analysis_type,
                finding_data=perf,
            )
            findings.append(finding)

        return findings
