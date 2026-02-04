"""
Relevance scoring service for research claims.

Scores claims on 0-1 scale based on:
- Keyword overlap with project goal
- Domain preferences
- Recency
- Citation count
"""
from typing import List, Dict, Any, Optional, Set
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import re
from datetime import datetime, timezone

from database.models import Project, Claim, Preference, Paper


class RelevanceService:
    """Service for calculating claim relevance scores."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def calculate_relevance(
        self,
        claim: Claim,
        project: Project,
        source_paper: Optional[Paper] = None,
    ) -> float:
        """
        Calculate relevance score for a claim.

        Args:
            claim: Claim object with claim_text, claim_data
            project: Project with research_goal, key_themes
            source_paper: Optional Paper with citation_count, year

        Returns:
            Relevance score from 0.0 to 1.0
        """
        score = 0.0

        # Extract keywords from project context
        project_keywords = await self._extract_project_keywords(project)

        # Factor 1: Keyword overlap (0-0.6)
        keyword_score = self._score_keyword_overlap(
            claim.claim_text,
            project_keywords,
        )
        score += keyword_score * 0.6

        # Factor 2: Domain preference (0-0.2)
        domain_score = await self._score_domain_preference(claim, project.id)
        score += domain_score * 0.2

        # Factor 3: Recency (0-0.1)
        if source_paper and source_paper.year:
            recency_score = self._score_recency(source_paper.year)
            score += recency_score * 0.1

        # Factor 4: Citation count (0-0.1)
        if source_paper and source_paper.citation_count:
            citation_score = self._score_citations(source_paper.citation_count)
            score += citation_score * 0.1

        return min(score, 1.0)  # Cap at 1.0

    async def _extract_project_keywords(self, project: Project) -> Set[str]:
        """Extract keywords from project goal and themes."""
        keywords = set()

        # Keywords from research goal
        if project.research_goal:
            keywords.update(self._extract_keywords(project.research_goal))

        # Keywords from key themes
        if project.key_themes:
            for theme in project.key_themes:
                keywords.update(self._extract_keywords(theme))

        # Keywords from search terms
        if project.search_terms:
            for term in project.search_terms:
                keywords.update(self._extract_keywords(term))

        # Keywords from user preferences
        topic_keywords = await self._get_preference(project.id, "topic_keywords")
        if topic_keywords:
            if isinstance(topic_keywords, list):
                keywords.update([k.lower() for k in topic_keywords])
            elif isinstance(topic_keywords, str):
                keywords.update(self._extract_keywords(topic_keywords))

        return keywords

    def _extract_keywords(self, text: str) -> Set[str]:
        """Extract lowercase keywords from text."""
        # Simple extraction: lowercase alphanumeric words
        words = re.findall(r'\b[a-z]{3,}\b', text.lower())
        # Remove common stop words
        stop_words = {
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
            'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'this',
            'that', 'with', 'they', 'from', 'what', 'which', 'their', 'there',
            'about', 'would', 'could', 'should', 'into', 'than', 'them', 'after'
        }
        return set(words) - stop_words

    def _score_keyword_overlap(self, claim_text: str, keywords: Set[str]) -> float:
        """
        Score based on keyword overlap using TF-IDF style matching.

        Returns score from 0.0 to 1.0.
        """
        if not keywords:
            return 0.0

        claim_words = self._extract_keywords(claim_text)

        if not claim_words:
            return 0.0

        # Calculate overlap ratio
        matching = claim_words & keywords
        total_keywords = len(keywords)

        # Score = (matching keywords / total keywords) with boost for multiple matches
        base_score = len(matching) / total_keywords
        match_boost = min(len(matching) * 0.1, 0.3)  # Boost up to 0.3 for multiple matches

        return min(base_score + match_boost, 1.0)

    async def _score_domain_preference(self, claim: Claim, project_id: str) -> float:
        """Score based on domain preferences."""
        domain_prefs = await self._get_preference(project_id, "domain_preferences")

        if not domain_prefs or not isinstance(domain_prefs, list):
            return 0.0

        # Check if claim matches any preferred domain
        claim_text_lower = claim.claim_text.lower()

        for domain in domain_prefs:
            if domain.lower() in claim_text_lower:
                return 0.8  # High boost for domain match

        return 0.0

    def _score_recency(self, year: int) -> float:
        """Score based on publication year (newer is better)."""
        current_year = datetime.now(timezone.utc).year
        age = current_year - year

        if age <= 1:
            return 1.0
        elif age <= 3:
            return 0.8
        elif age <= 5:
            return 0.6
        elif age <= 10:
            return 0.4
        else:
            return 0.2

    def _score_citations(self, citation_count: int) -> float:
        """Score based on citation count (logarithmic scale)."""
        if citation_count == 0:
            return 0.0
        elif citation_count < 10:
            return 0.5
        elif citation_count < 50:
            return 0.7
        elif citation_count < 100:
            return 0.85
        else:
            return 1.0

    async def _get_preference(self, project_id: str, key: str) -> Any:
        """Get a preference value."""
        result = await self.session.execute(
            select(Preference).where(
                Preference.project_id == project_id,
                Preference.key == key
            )
        )
        pref = result.scalar_one_or_none()
        return pref.value if pref else None

    async def recalculate_project_claims(self, project_id: str) -> int:
        """
        Re-score all claims for a project.

        Args:
            project_id: Project to re-score

        Returns:
            Number of claims re-scored
        """
        # Get project
        result = await self.session.execute(
            select(Project).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()

        if not project:
            raise ValueError(f"Project {project_id} not found")

        # Get all claims with paper sources
        result = await self.session.execute(
            select(Claim).where(Claim.project_id == project_id)
        )
        claims = list(result.scalars().all())

        count = 0
        for claim in claims:
            # Get source paper if available
            source_paper = None
            if claim.source_type == "paper":
                result = await self.session.execute(
                    select(Paper).where(Paper.id == claim.source_id)
                )
                source_paper = result.scalar_one_or_none()

            # Calculate and update relevance
            claim.relevance_score = await self.calculate_relevance(
                claim, project, source_paper
            )
            count += 1

        await self.session.flush()
        return count
