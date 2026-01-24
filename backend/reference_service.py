"""
Reference Extraction Service - Extract citations and references from papers.
"""
import re
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class Reference:
    """Parsed reference from a paper."""
    raw_text: str
    authors: List[str]
    title: Optional[str]
    year: Optional[int]
    journal: Optional[str]
    doi: Optional[str]
    arxiv_id: Optional[str]
    confidence: float  # 0-1 confidence in parsing accuracy


class ReferenceExtractor:
    """Extract and parse references from academic papers."""
    
    # Patterns for finding reference sections
    REFERENCE_SECTION_PATTERNS = [
        r'\n\s*(?:References|REFERENCES|Bibliography|BIBLIOGRAPHY|Works Cited|WORKS CITED)\s*\n',
        r'\n\s*(?:\d+\.\s*)?(?:References|REFERENCES)\s*\n',
    ]
    
    # Patterns for individual references
    REFERENCE_PATTERNS = [
        # Numbered references: [1], 1., (1)
        r'(?:\[(\d+)\]|\((\d+)\)|^(\d+)\.)\s*(.+?)(?=(?:\[\d+\]|\(\d+\)|^\d+\.|\Z))',
        # Author-year style
        r'([A-Z][a-z]+(?:\s+(?:et\s+al\.?|and|&)\s+[A-Z][a-z]+)*)\s*\((\d{4})\)\.?\s*(.+?)(?=\n[A-Z]|\Z)',
    ]
    
    # Pattern for extracting DOI
    DOI_PATTERN = r'(?:doi[:\s]*|https?://(?:dx\.)?doi\.org/)?(10\.\d{4,}/[^\s]+)'
    
    # Pattern for extracting arXiv ID
    ARXIV_PATTERN = r'arXiv[:\s]*(\d{4}\.\d{4,5}(?:v\d+)?)'
    
    # Pattern for year
    YEAR_PATTERN = r'\b(19\d{2}|20[0-2]\d)\b'
    
    def __init__(self):
        pass
    
    def extract_references(self, text: str) -> List[Reference]:
        """Extract all references from paper text."""
        references = []
        
        # Find reference section
        ref_section = self._find_reference_section(text)
        if not ref_section:
            logger.warning("No reference section found")
            return references
        
        # Split into individual references
        raw_refs = self._split_references(ref_section)
        
        # Parse each reference
        for raw_ref in raw_refs:
            parsed = self._parse_reference(raw_ref)
            if parsed:
                references.append(parsed)
        
        return references
    
    def _find_reference_section(self, text: str) -> Optional[str]:
        """Find and extract the reference section from text."""
        for pattern in self.REFERENCE_SECTION_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                # Get everything after the reference header
                start = match.end()
                
                # Try to find the end (next major section or end of document)
                end_patterns = [
                    r'\n\s*(?:Appendix|APPENDIX|Supplementary|SUPPLEMENTARY)',
                    r'\n\s*(?:Acknowledgment|ACKNOWLEDGMENT)',
                ]
                
                end = len(text)
                for end_pattern in end_patterns:
                    end_match = re.search(end_pattern, text[start:], re.IGNORECASE)
                    if end_match:
                        end = start + end_match.start()
                        break
                
                return text[start:end]
        
        return None
    
    def _split_references(self, ref_section: str) -> List[str]:
        """Split reference section into individual references."""
        references = []
        
        # Try numbered reference pattern first [1], [2], etc.
        numbered_pattern = r'\[(\d+)\]'
        if re.search(numbered_pattern, ref_section):
            parts = re.split(r'\n(?=\[\d+\])', ref_section)
            references = [p.strip() for p in parts if p.strip()]
        else:
            # Try splitting by newlines with capital letters (author names)
            lines = ref_section.split('\n')
            current_ref = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Check if this starts a new reference
                if re.match(r'^[A-Z][a-z]+,?\s+[A-Z]', line) and current_ref:
                    references.append(' '.join(current_ref))
                    current_ref = [line]
                elif re.match(r'^\d+\.?\s+[A-Z]', line) and current_ref:
                    references.append(' '.join(current_ref))
                    current_ref = [line]
                else:
                    current_ref.append(line)
            
            if current_ref:
                references.append(' '.join(current_ref))
        
        return references
    
    def _parse_reference(self, raw_text: str) -> Optional[Reference]:
        """Parse a single reference string into structured data."""
        if len(raw_text) < 20:  # Too short to be a valid reference
            return None
        
        # Extract DOI
        doi_match = re.search(self.DOI_PATTERN, raw_text, re.IGNORECASE)
        doi = doi_match.group(1) if doi_match else None
        
        # Extract arXiv ID
        arxiv_match = re.search(self.ARXIV_PATTERN, raw_text, re.IGNORECASE)
        arxiv_id = arxiv_match.group(1) if arxiv_match else None
        
        # Extract year
        year_matches = re.findall(self.YEAR_PATTERN, raw_text)
        year = int(year_matches[0]) if year_matches else None
        
        # Extract authors (simplified - look for names at start)
        authors = self._extract_authors(raw_text)
        
        # Extract title (text in quotes or after authors before journal)
        title = self._extract_title(raw_text)
        
        # Extract journal (often italicized or after title)
        journal = self._extract_journal(raw_text)
        
        # Calculate confidence based on what we found
        confidence = self._calculate_confidence(authors, title, year, doi, arxiv_id)
        
        return Reference(
            raw_text=raw_text.strip(),
            authors=authors,
            title=title,
            year=year,
            journal=journal,
            doi=doi,
            arxiv_id=arxiv_id,
            confidence=confidence
        )
    
    def _extract_authors(self, text: str) -> List[str]:
        """Extract author names from reference."""
        authors = []
        
        # Pattern for "LastName, F." or "LastName, FirstName"
        author_pattern = r'([A-Z][a-z]+(?:-[A-Z][a-z]+)?),\s*([A-Z]\.?(?:\s*[A-Z]\.?)*)'
        matches = re.findall(author_pattern, text[:200])  # Look in first 200 chars
        
        for match in matches[:10]:  # Limit to 10 authors
            authors.append(f"{match[0]}, {match[1]}")
        
        # Also try "F. LastName" pattern
        if not authors:
            alt_pattern = r'([A-Z]\.(?:\s*[A-Z]\.)*)\s+([A-Z][a-z]+(?:-[A-Z][a-z]+)?)'
            matches = re.findall(alt_pattern, text[:200])
            for match in matches[:10]:
                authors.append(f"{match[1]}, {match[0]}")
        
        return authors
    
    def _extract_title(self, text: str) -> Optional[str]:
        """Extract paper title from reference."""
        # Look for quoted text
        quote_match = re.search(r'"([^"]+)"', text)
        if quote_match:
            return quote_match.group(1)
        
        # Look for text after year and before journal markers
        year_match = re.search(self.YEAR_PATTERN, text)
        if year_match:
            after_year = text[year_match.end():]
            # Title often ends with period before journal name
            title_match = re.match(r'[.\s]*([^.]+\.)', after_year)
            if title_match:
                title = title_match.group(1).strip()
                if len(title) > 10:
                    return title
        
        return None
    
    def _extract_journal(self, text: str) -> Optional[str]:
        """Extract journal name from reference."""
        # Common journal indicators
        journal_indicators = ['Journal', 'Proceedings', 'Conference', 'Trans.', 'Review', 'Letters']
        
        for indicator in journal_indicators:
            match = re.search(rf'({indicator}[^,.\d]{{5,50}})', text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _calculate_confidence(
        self, 
        authors: List[str], 
        title: Optional[str], 
        year: Optional[int],
        doi: Optional[str],
        arxiv_id: Optional[str]
    ) -> float:
        """Calculate confidence score for parsed reference."""
        score = 0.0
        
        if authors:
            score += 0.2
        if title and len(title) > 20:
            score += 0.3
        if year:
            score += 0.2
        if doi:
            score += 0.2
        if arxiv_id:
            score += 0.1
        
        return min(score, 1.0)
    
    def to_dict(self, ref: Reference) -> Dict[str, Any]:
        """Convert Reference to dictionary."""
        return {
            "raw_text": ref.raw_text,
            "authors": ref.authors,
            "title": ref.title,
            "year": ref.year,
            "journal": ref.journal,
            "doi": ref.doi,
            "arxiv_id": ref.arxiv_id,
            "confidence": ref.confidence
        }


# Singleton instance
reference_extractor = ReferenceExtractor()
