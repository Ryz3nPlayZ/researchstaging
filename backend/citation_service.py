"""
Citation service for formatting academic citations in various styles.
Supports APA, MLA, and Chicago citation formats.
"""
from typing import Dict, Any, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import re


class CitationService:
    """
    Service for formatting and managing academic citations.

    Supports:
    - APA (American Psychological Association) 7th edition
    - MLA (Modern Language Association) 9th edition
    - Chicago (Chicago Manual of Style) 17th edition
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def format_citation(
        self,
        source_type: str,
        source_id: Optional[str],
        citation_data: Optional[Dict[str, Any]] = None,
        style: str = "apa"
    ) -> str:
        """
        Format a citation in the specified style.

        Args:
            source_type: Type of source (paper, claim, manual)
            source_id: ID of the source (for paper/claim)
            citation_data: Manual citation data (for manual type)
            style: Citation style (apa, mla, chicago)

        Returns:
            Formatted citation string
        """
        if source_type == "manual":
            if not citation_data:
                return "Citation data required for manual citations"
            return self._format_manual_citation(citation_data, style)

        elif source_type == "paper":
            return await self._format_paper_citation(source_id, style)

        elif source_type == "claim":
            return await self._format_claim_citation(source_id, style)

        else:
            return f"Unknown source type: {source_type}"

    async def _format_paper_citation(self, paper_id: str, style: str) -> str:
        """Format citation from Paper model."""
        from database.models import Paper

        result = await self.session.execute(
            select(Paper).where(Paper.id == paper_id)
        )
        paper = result.scalar_one_or_none()

        if not paper:
            return f"Paper not found: {paper_id}"

        # Extract citation data
        authors = paper.authors or []
        year = paper.year
        title = paper.title
        # Try to extract venue from external_id or url
        venue = self._extract_venue(paper)

        if style == "apa":
            return self._format_apa(authors, year, title, venue)
        elif style == "mla":
            return self._format_mla(authors, year, title, venue)
        elif style == "chicago":
            return self._format_chicago(authors, year, title, venue)
        else:
            return f"Unknown citation style: {style}"

    async def _format_claim_citation(self, claim_id: str, style: str) -> str:
        """Format citation from Claim model (links to Paper)."""
        from database.models import Claim, Paper

        # Get claim
        claim_result = await self.session.execute(
            select(Claim).where(Claim.id == claim_id)
        )
        claim = claim_result.scalar_one_or_none()

        if not claim:
            return f"Claim not found: {claim_id}"

        # If claim is from a paper, format the paper citation
        if claim.source_type.value == "paper":
            paper_result = await self.session.execute(
                select(Paper).where(Paper.id == claim.source_id)
            )
            paper = paper_result.scalar_one_or_none()

            if paper:
                authors = paper.authors or []
                year = paper.year
                title = paper.title
                venue = self._extract_venue(paper)

                if style == "apa":
                    return self._format_apa(authors, year, title, venue)
                elif style == "mla":
                    return self._format_mla(authors, year, title, venue)
                elif style == "chicago":
                    return self._format_chicago(authors, year, title, venue)

        # Fallback: claim citation
        return f"Claim: {claim.claim_text} ({claim.extracted_at.strftime('%Y')})"

    def _format_manual_citation(self, citation_data: Dict[str, Any], style: str) -> str:
        """Format manual citation from provided data."""
        authors = citation_data.get("authors", [])
        year = citation_data.get("year")
        title = citation_data.get("title", "")
        venue = citation_data.get("venue", "")

        if style == "apa":
            return self._format_apa(authors, year, title, venue)
        elif style == "mla":
            return self._format_mla(authors, year, title, venue)
        elif style == "chicago":
            return self._format_chicago(authors, year, title, venue)
        else:
            return f"Unknown citation style: {style}"

    def _format_apa(
        self,
        authors: List[str],
        year: Optional[int],
        title: str,
        venue: str
    ) -> str:
        """
        Format citation in APA 7th edition style.

        Format: Author, A. A., & Author, B. B. (Year). Title. Venue.
        """
        # Format authors
        author_str = self._format_authors_apa(authors)
        if not author_str:
            author_str = "Anonymous"

        # Format year
        year_str = f"({year})" if year else "(n.d.)"

        # Combine
        citation = f"{author_str} {year_str}. {title}"
        if venue:
            citation += f". {venue}"

        citation += "."

        return citation

    def _format_mla(
        self,
        authors: List[str],
        year: Optional[int],
        title: str,
        venue: str
    ) -> str:
        """
        Format citation in MLA 9th edition style.

        Format: Author. "Title." Venue, Year.
        """
        # Format authors
        author_str = self._format_authors_mla(authors)
        if not author_str:
            author_str = "Anonymous"

        # Format title with quotes
        title_str = f'"{title}"' if title else ""

        # Combine
        citation = f"{author_str}. {title_str}"
        if venue:
            citation += f". {venue}"

        if year:
            citation += f", {year}"

        citation += "."

        return citation

    def _format_chicago(
        self,
        authors: List[str],
        year: Optional[int],
        title: str,
        venue: str
    ) -> str:
        """
        Format citation in Chicago notes and bibliography style.

        Format: Author. Year. "Title." Venue.
        """
        # Format authors
        author_str = self._format_authors_chicago(authors)
        if not author_str:
            author_str = "Anonymous"

        # Format title with quotes
        title_str = f'"{title}"' if title else ""

        # Combine
        citation = f"{author_str}"
        if year:
            citation += f". {year}"

        if title_str:
            citation += f'. {title_str}'

        if venue:
            citation += f". {venue}"

        citation += "."

        return citation

    def _format_authors_apa(self, authors: List[str]) -> str:
        """Format authors list in APA style."""
        if not authors:
            return ""

        if len(authors) == 1:
            return self._format_author_name_apa(authors[0])

        elif len(authors) == 2:
            return f"{self._format_author_name_apa(authors[0])} & {self._format_author_name_apa(authors[1])}"

        elif len(authors) <= 20:
            formatted = ", ".join([self._format_author_name_apa(a) for a in authors[:-1]])
            return f"{formatted}, & {self._format_author_name_apa(authors[-1])}"

        else:
            # APA: list first 19, then ... , last author
            formatted = ", ".join([self._format_author_name_apa(a) for a in authors[:19]])
            return f"{formatted}, ... {self._format_author_name_apa(authors[-1])}"

    def _format_author_name_apa(self, author: str) -> str:
        """Format single author name in APA style: Last, F. M."""
        parts = author.strip().split()

        if len(parts) == 1:
            return parts[0]

        # Last name is first part, rest are initials
        last_name = parts[0]
        initials = " ".join([f"{p[0]}." for p in parts[1:]])

        return f"{last_name}, {initials}"

    def _format_authors_mla(self, authors: List[str]) -> str:
        """Format authors list in MLA style."""
        if not authors:
            return ""

        if len(authors) == 1:
            return self._format_author_name_mla(authors[0])

        elif len(authors) == 2:
            return f"{self._format_author_name_mla(authors[0])}, and {self._format_author_name_mla(authors[1])}"

        else:
            # MLA: first author, et al.
            return f"{self._format_author_name_mla(authors[0])}, et al."

    def _format_author_name_mla(self, author: str) -> str:
        """Format single author name in MLA style: First Last."""
        return author.strip()

    def _format_authors_chicago(self, authors: List[str]) -> str:
        """Format authors list in Chicago style."""
        if not authors:
            return ""

        if len(authors) == 1:
            return self._format_author_name_chicago(authors[0])

        elif len(authors) <= 3:
            formatted = ", ".join([self._format_author_name_chicago(a) for a in authors])
            return f"{formatted}."

        elif len(authors) == 4:
            formatted = ", ".join([self._format_author_name_chicago(a) for a in authors])
            return f"{formatted}."

        else:
            # Chicago: list first 3, then et al.
            formatted = ", ".join([self._format_author_name_chicago(a) for a in authors[:3]])
            return f"{formatted}, et al."

    def _format_author_name_chicago(self, author: str) -> str:
        """Format single author name in Chicago style: Last, First."""
        parts = author.strip().split()

        if len(parts) == 1:
            return parts[0]

        # Last name is first part, rest are first names
        last_name = parts[0]
        first_names = " ".join(parts[1:])

        return f"{last_name}, {first_names}"

    def _extract_venue(self, paper) -> str:
        """Extract venue (journal/conference) from Paper model."""
        # Try to extract from external_id, url, or abstract
        if paper.url:
            # Try to extract domain or venue from URL
            match = re.search(r'(?:arxiv\.org|dl\.acm\.org|ieeexplore\.ieee\.org|springer\.com|sciencedirect\.com)', paper.url)
            if match:
                domain = match.group(1)
                # Clean up domain name
                return domain.replace(".org", "").replace(".com", "").title()

        # Try to extract from abstract
        if paper.abstract:
            # Look for common venue patterns
            match = re.search(r'(?:Published in|Presented at|Proceedings of)\s+([^,.]+)', paper.abstract, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        # Fallback to source
        if paper.source:
            return paper.source.replace("_", " ").title()

        return ""

    async def format_bibliography(
        self,
        citations: List[Dict[str, Any]],
        style: str = "apa"
    ) -> str:
        """
        Format a bibliography from a list of citations.

        Args:
            citations: List of citation dicts with source_type, source_id, citation_data
            style: Citation style (apa, mla, chicago)

        Returns:
            Formatted bibliography string (one citation per line)
        """
        formatted_citations = []

        for citation in citations:
            source_type = citation.get("source_type")
            source_id = citation.get("source_id")
            citation_data = citation.get("citation_data")

            formatted = await self.format_citation(
                source_type=source_type,
                source_id=source_id,
                citation_data=citation_data,
                style=style
            )
            formatted_citations.append(formatted)

        # Sort bibliography by style requirements
        if style in ["apa", "mla"]:
            # Alphabetical by first author/title
            formatted_citations.sort(key=lambda x: x.lower())

        elif style == "chicago":
            # Sort by type (books first, then articles, then web)
            formatted_citations.sort(key=lambda x: x.lower())

        # Join with newlines
        return "\n\n".join(formatted_citations)
