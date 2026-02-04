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
