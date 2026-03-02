"""
Service for extracting claims from research papers and building relationship graphs.
"""

import json
import logging
import re
from collections import defaultdict
from typing import Any, Dict, List, Optional, Tuple

import networkx as nx
from llm_service import llm_service
from pdf_service import pdf_service

logger = logging.getLogger(__name__)


class ClaimExtractionService:
    """
    Extracts claims from research papers and identifies relationships.
    """

    CLAIM_TYPES = {
        "fact": "Observable data or measurement",
        "claim": "Conclusion, argument, or stated finding",
        "assumption": "Unproven premise taken as given",
        "implication": "Inference or suggested consequence",
    }

    RELATIONSHIP_TYPES = {
        "supports": "Source provides evidence for target",
        "contradicts": "Source opposes or refutes target",
        "assumes": "Source depends on target being true",
        "implies": "Source logically leads to target",
        "method_of": "Source is the method used to produce target",
    }

    # Keywords that signal relationships
    SUPPORT_MARKERS = [
        "supports",
        "confirms",
        "validates",
        "demonstrates",
        "shows",
        "indicates",
        "suggests",
        "provides evidence",
        "consistent with",
        "therefore",
        "thus",
        "hence",
        "consequently",
    ]

    CONTRADICTION_MARKERS = [
        "however",
        "but",
        "although",
        "nevertheless",
        "contrary to",
        "in contrast",
        "unlike",
        "whereas",
        "while",
        "despite",
        "challenges",
        "refutes",
        "inconsistent with",
        "conflicts with",
    ]

    ASSUMPTION_MARKERS = [
        "assume",
        "assuming",
        "given that",
        "provided that",
        "under the assumption",
        "we assume",
        "it is assumed",
    ]

    IMPLICATION_MARKERS = [
        "implies",
        "suggests",
        "indicates",
        "this means",
        "consequently",
        "as a result",
        "leading to",
        "which suggests",
    ]

    async def extract_claims_from_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """
        Main entry point: extract claims and build graph from PDF.

        Returns:
            {
                "claims": [...],
                "relationships": [...],
                "contradictions": [...],
                "stats": {...}
            }
        """
        logger.info(f"Starting claim extraction from {pdf_path}")

        # 1. Extract text and structure
        text, structure = await self._extract_text_structure(pdf_path)

        # 2. Extract claims by section
        claims = []
        for section in structure.get("sections", []):
            section_claims = await self._extract_claims_from_section(
                section["text"], section["name"], section.get("paragraphs", [])
            )
            claims.extend(section_claims)

        logger.info(f"Extracted {len(claims)} raw claims")

        # 3. Deduplicate and clean
        claims = self._deduplicate_claims(claims)
        logger.info(f"After deduplication: {len(claims)} claims")

        # 4. Find relationships
        relationships = await self._find_relationships(claims, text)
        logger.info(f"Found {len(relationships)} relationships")

        # 5. Detect contradictions
        contradictions = await self._detect_contradictions(claims)
        logger.info(f"Detected {len(contradictions)} contradictions")

        # 6. Calculate importance scores (graph centrality)
        claims = self._calculate_importance(claims, relationships)

        return {
            "claims": claims,
            "relationships": relationships,
            "contradictions": contradictions,
            "stats": {
                "total_claims": len(claims),
                "by_type": self._count_by_type(claims),
                "relationships": len(relationships),
                "contradictions": len(contradictions),
            },
            "text": text,
            "structure": structure,
        }

    async def _extract_text_structure(self, pdf_path: str) -> Tuple[str, Dict]:
        """Extract text and identify structure (sections, paragraphs)."""
        # Use existing PDF service
        text = await pdf_service.extract_text(pdf_path)

        # Simple section detection
        sections = self._detect_sections(text)

        return text, {"sections": sections, "full_text": text}

    def _detect_sections(self, text: str) -> List[Dict]:
        """Detect paper sections using common headers."""
        section_patterns = [
            (r"\bAbstract\b", "abstract"),
            (r"\bIntroduction\b", "intro"),
            (r"\bBackground\b", "intro"),
            (r"\bMethods?\b|\bMethodology\b|\bExperimental Setup\b", "methods"),
            (r"\bResults?\b|\bFindings\b", "results"),
            (r"\bDiscussion\b", "discussion"),
            (r"\bConclusion\b|\bConcluding Remarks\b", "conclusion"),
            (r"\bLimitations\b", "limitations"),
            (r"\bFuture Work\b|\bFuture Directions\b", "future_work"),
            (r"\bReferences?\b|\bBibliography\b", "references"),
        ]

        # Find all section boundaries
        section_boundaries = []
        for pattern, section_name in section_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                section_boundaries.append((match.start(), section_name))

        # Sort by position
        section_boundaries.sort()

        # Build sections
        sections = []
        for i, (start_pos, name) in enumerate(section_boundaries):
            end_pos = (
                section_boundaries[i + 1][0]
                if i + 1 < len(section_boundaries)
                else len(text)
            )
            section_text = text[start_pos:end_pos]

            # Split into paragraphs
            paragraphs = [p.strip() for p in section_text.split("\n\n") if p.strip()]

            sections.append(
                {
                    "name": name,
                    "text": section_text,
                    "paragraphs": paragraphs,
                    "start_pos": start_pos,
                    "end_pos": end_pos,
                }
            )

        # If no sections detected, treat as one big section
        if not sections:
            paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
            sections.append(
                {
                    "name": "body",
                    "text": text,
                    "paragraphs": paragraphs,
                    "start_pos": 0,
                    "end_pos": len(text),
                }
            )

        return sections

    async def _extract_claims_from_section(
        self, section_text: str, section_name: str, paragraphs: List[str]
    ) -> List[Dict]:
        """Extract claims from a section using LLM."""
        claims = []

        system_prompt = f"""You are a research paper analyzer. Extract ALL claims from the provided text.

Claim types:
- fact: Observable data or measurements ("We found X = 5", "The accuracy was 90%")
- claim: Conclusions or arguments ("Our method outperforms baselines", "This proves that...")
- assumption: Unproven premises ("Assuming normal distribution", "Given that X is true")
- implication: Inferences or suggestions ("This suggests...", "These results imply...")

Instructions:
1. Extract EVERY statement that is in any way conclusive, open-ended, or implies something
2. Include exact quotes when possible
3. Assign the most appropriate type
4. Rate confidence 0-1 based on clarity

Return JSON:
{{
    "claims": [
        {{
            "text": "normalized claim text",
            "quote": "exact text from paper",
            "claim_type": "fact|claim|assumption|implication",
            "confidence": 0.9,
            "paragraph_index": 0
        }}
    ]
}}"""

        # Process each paragraph
        for idx, paragraph in enumerate(paragraphs):
            if len(paragraph) < 50:  # Skip very short paragraphs
                continue

            try:
                response = await llm_service.generate(
                    prompt=f"Section: {section_name}\n\nParagraph:\n{paragraph[:2000]}",
                    system_message=system_prompt,
                )

                result = json.loads(response)
                for claim in result.get("claims", []):
                    claim["section"] = section_name
                    claim["paragraph_index"] = idx
                    claim["full_context"] = paragraph
                    claims.append(claim)

            except (json.JSONDecodeError, Exception) as e:
                logger.warning(f"Failed to extract claims from paragraph: {e}")
                continue

        return claims

    def _deduplicate_claims(self, claims: List[Dict]) -> List[Dict]:
        """Remove near-duplicate claims."""
        if not claims:
            return claims

        unique = []
        seen_texts = set()

        for claim in claims:
            # Normalize for comparison
            normalized = claim["text"].lower().strip()[:100]

            # Check for near-duplicates
            is_duplicate = False
            for seen in seen_texts:
                if self._text_similarity(normalized, seen) > 0.8:
                    is_duplicate = True
                    break

            if not is_duplicate:
                seen_texts.add(normalized)
                unique.append(claim)

        return unique

    def _text_similarity(self, text1: str, text2: str) -> float:
        """Simple Jaccard similarity."""
        words1 = set(text1.split())
        words2 = set(text2.split())
        if not words1 or not words2:
            return 0.0
        intersection = words1 & words2
        union = words1 | words2
        return len(intersection) / len(union)

    async def _find_relationships(
        self, claims: List[Dict], full_text: str
    ) -> List[Dict]:
        """Find relationships between claims."""
        relationships = []

        # Strategy 1: Proximity-based relationships
        for i, claim1 in enumerate(claims):
            for claim2 in claims[i + 1 :]:
                # Same paragraph = likely related
                if (
                    claim1.get("section") == claim2.get("section")
                    and abs(
                        claim1.get("paragraph_index", 0)
                        - claim2.get("paragraph_index", 0)
                    )
                    <= 1
                ):
                    rel = self._detect_relationship_from_markers(claim1, claim2)
                    if rel:
                        relationships.append(
                            {
                                "source_index": i,
                                "target_index": claims.index(claim2),
                                "source_text": claim1["text"],
                                "target_text": claim2["text"],
                                "relationship_type": rel["type"],
                                "confidence": rel["confidence"],
                                "detection_method": "proximity",
                            }
                        )

        # Strategy 2: LLM-based for high-confidence claims
        high_confidence_claims = [
            (i, c) for i, c in enumerate(claims) if c.get("confidence", 0) > 0.8
        ]

        for i, (idx1, claim1) in enumerate(high_confidence_claims):
            for idx2, claim2 in high_confidence_claims[i + 1 :]:
                # Skip if already have a relationship
                if any(
                    r["source_index"] == idx1 and r["target_index"] == idx2
                    for r in relationships
                ):
                    continue

                rel = await self._llm_classify_relationship(claim1, claim2)
                if rel and rel["type"] != "none":
                    relationships.append(
                        {
                            "source_index": idx1,
                            "target_index": idx2,
                            "source_text": claim1["text"],
                            "target_text": claim2["text"],
                            "relationship_type": rel["type"],
                            "confidence": rel["confidence"],
                            "detection_method": "llm",
                        }
                    )

        return relationships

    def _detect_relationship_from_markers(
        self, claim1: Dict, claim2: Dict
    ) -> Optional[Dict]:
        """Detect relationship type from linguistic markers."""
        text_between = self._get_text_between(claim1, claim2)
        text_lower = text_between.lower()

        # Check for contradiction markers
        if any(marker in text_lower for marker in self.CONTRADICTION_MARKERS):
            return {"type": "contradicts", "confidence": 0.6}

        # Check for implication
        if any(marker in text_lower for marker in self.IMPLICATION_MARKERS):
            return {"type": "implies", "confidence": 0.5}

        # Check for assumption
        if claim2.get("claim_type") == "assumption":
            return {"type": "assumes", "confidence": 0.5}

        # Check for method relationship
        if claim1.get("claim_type") == "fact" and claim2.get("claim_type") == "method":
            return {"type": "method_of", "confidence": 0.5}

        # Default to supports if in same context
        return {"type": "supports", "confidence": 0.4}

    def _get_text_between(self, claim1: Dict, claim2: Dict) -> str:
        """Get text between two claims."""
        # Simple implementation - in production, use actual positions
        return ""

    async def _llm_classify_relationship(
        self, claim1: Dict, claim2: Dict
    ) -> Optional[Dict]:
        """Use LLM to classify relationship."""
        prompt = f"""Analyze the relationship between these two claims:

Claim A: {claim1["text"]}
Claim B: {claim2["text"]}

What is the relationship from A to B?
Options: supports, contradicts, assumes, implies, method_of, none

Respond with JSON: {{"type": "relationship", "confidence": 0.8}}"""

        try:
            response = await llm_service.generate(prompt)
            result = json.loads(response)
            return result
        except:
            return {"type": "none", "confidence": 0}

    async def _detect_contradictions(self, claims: List[Dict]) -> List[Dict]:
        """Detect contradictions between claims."""
        contradictions = []

        for i, claim1 in enumerate(claims):
            for claim2 in claims[i + 1 :]:
                contradiction = self._check_contradiction(claim1, claim2)
                if contradiction:
                    contradictions.append(contradiction)

        return contradictions

    def _check_contradiction(self, claim1: Dict, claim2: Dict) -> Optional[Dict]:
        """Check if two claims contradict."""
        text1 = claim1["text"].lower()
        text2 = claim2["text"].lower()

        # Check 1: Numerical contradiction
        nums1 = self._extract_numbers(text1)
        nums2 = self._extract_numbers(text2)

        if nums1 and nums2:
            # Same metric, different values
            if self._same_metric_different_value(text1, text2, nums1, nums2):
                return {
                    "claim_1_index": None,  # Set by caller
                    "claim_2_index": None,
                    "contradiction_type": "numerical",
                    "severity": "high",
                    "explanation": f"Different values for same measurement: {nums1[0]} vs {nums2[0]}",
                }

        # Check 2: Explicit negation
        negation_words = ["not", "no", "never", "false", "incorrect"]

        # Check if claim2 negates claim1
        for neg in negation_words:
            if neg in text2:
                # Remove negation and compare
                text2_clean = text2.replace(neg, "").strip()
                if self._text_similarity(text1, text2_clean) > 0.6:
                    return {
                        "claim_1_index": None,
                        "claim_2_index": None,
                        "contradiction_type": "logical",
                        "severity": "critical",
                        "explanation": f"Explicit negation: '{claim1['text'][:50]}...' vs '{claim2['text'][:50]}...'",
                    }

        # Check 3: Contradiction markers in context
        if claim1.get("full_context") and claim2.get("full_context"):
            # If they're discussed together with contradiction markers
            pass  # Would need full text context

        return None

    def _extract_numbers(self, text: str) -> List[float]:
        """Extract numbers from text."""
        import re

        numbers = []
        for match in re.finditer(
            r"\b(\d+(?:\.\d+)?)\s*(%|percent|percentage)?\b", text
        ):
            try:
                numbers.append(float(match.group(1)))
            except:
                pass
        return numbers

    def _same_metric_different_value(
        self, text1: str, text2: str, nums1: List[float], nums2: List[float]
    ) -> bool:
        """Check if same metric is mentioned with different values."""
        # Very simple check - look for shared keywords besides numbers
        words1 = set(text1.split()) - set(str(n) for n in nums1)
        words2 = set(text2.split()) - set(str(n) for n in nums2)

        # If they share many words, likely same metric
        shared = words1 & words2
        return len(shared) > 3 and nums1 and nums2 and nums1[0] != nums2[0]

    def _calculate_importance(
        self, claims: List[Dict], relationships: List[Dict]
    ) -> List[Dict]:
        """Calculate importance using graph centrality."""
        if not relationships:
            for claim in claims:
                claim["importance_score"] = claim.get("confidence", 0.5)
            return claims

        # Build graph
        G = nx.DiGraph()
        for i, claim in enumerate(claims):
            G.add_node(i, **claim)

        for rel in relationships:
            G.add_edge(rel["source_index"], rel["target_index"], **rel)

        # Calculate centrality
        try:
            centrality = nx.degree_centrality(G)
            for i, claim in enumerate(claims):
                claim["importance_score"] = centrality.get(i, 0.5)
        except:
            for claim in claims:
                claim["importance_score"] = claim.get("confidence", 0.5)

        return claims

    def _count_by_type(self, claims: List[Dict]) -> Dict[str, int]:
        """Count claims by type."""
        counts = defaultdict(int)
        for claim in claims:
            counts[claim.get("claim_type", "unknown")] += 1
        return dict(counts)


# Singleton
claim_extraction_service = ClaimExtractionService()
