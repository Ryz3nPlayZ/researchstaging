"""
Query understanding (R5-R7): domain-adaptive intent, structured intent object, query expansion.

This module now emits a strict SRO-compatible structure while keeping legacy keys
(`attributes`, `expanded_terms`) for backward compatibility.
"""
import json
import logging
import re
from typing import Any, Dict, List

from llm_service import llm_service

logger = logging.getLogger(__name__)

DOMAINS = [
    "ml_cs",
    "biomed_clinical",
    "education",
    "economics",
    "general_empirical",
    "theoretical",
]


async def parse_query(query: str) -> Dict[str, Any]:
    """
    R5: Classify domain and generate dynamic structured intent schema.
    R6: Return structured intent object with domain, attributes, expanded_terms, exclusions.
    R7: Per-attribute expansion for retrieval.
    """
    system = """You are a research query analyzer.

Given a free-text research query, return ONE strict JSON object and nothing else.

Required JSON schema:
{
    "domain": "ml_cs|biomed_clinical|education|economics|general_empirical|theoretical",
    "core_topic": "short phrase",
    "expanded_query_terms": ["..."],
    "method_preferences": ["..."],
    "domain_constraints": ["..."],
    "year_min": 2020,
    "year_max": 2026,
    "novelty_mode": "recent|foundational|balanced",
    "paper_type_preference": ["empirical|survey|theoretical"],
    "strictness": 0.0,
    "attributes": {"key": "value"},
    "exclusions": ["..."]
}

Rules:
- strictness must be in [0, 1]
- if year is unknown, default to 2015..current year
- keep arrays empty rather than null
- do not include markdown or comments
- STRICTNESS GUIDANCE:
  * Queries involving geographic/regional variation, socioeconomic disparities, demographic
    comparisons, prevalence, epidemiology, or population-level distribution should use
    strictness >= 0.72 and include domain_constraints like ["epidemiology", "public health",
    "population study"] or ["sociology", "survey research"] as appropriate.
  * Broad exploratory queries ("what is X") may use strictness 0.3-0.5.
  * Specific methodology queries use strictness 0.6-0.8.
"""

    prompt = f"Research query: {query}"

    try:
        raw = await llm_service.generate(prompt, system_message=system)
        # Strip code block if present
        text = raw.strip()
        if text.startswith("```"):
            text = re.sub(r"^```\w*\n?", "", text)
            text = re.sub(r"\n?```\s*$", "", text)
        data = json.loads(text)
        domain = data.get("domain", "general_empirical")
        if domain not in DOMAINS:
            domain = "general_empirical"

        strictness = data.get("strictness", 0.5)
        try:
            strictness = float(strictness)
        except (TypeError, ValueError):
            strictness = 0.5
        strictness = max(0.0, min(1.0, strictness))

        year_min = data.get("year_min")
        year_max = data.get("year_max")
        current_year = 2100
        try:
            from datetime import datetime, timezone
            current_year = datetime.now(timezone.utc).year
        except Exception:
            current_year = 2026

        if not isinstance(year_min, int):
            year_min = 2015
        if not isinstance(year_max, int):
            year_max = current_year
        if year_min > year_max:
            year_min, year_max = year_max, year_min

        novelty_mode = data.get("novelty_mode", "balanced")
        if novelty_mode not in {"recent", "foundational", "balanced"}:
            novelty_mode = "balanced"

        expanded_terms = data.get("expanded_query_terms") or data.get("expanded_terms") or []
        method_preferences = data.get("method_preferences") or []
        domain_constraints = data.get("domain_constraints") or []
        paper_type_preference = data.get("paper_type_preference") or []
        attributes = data.get("attributes") or {}

        core_topic = data.get("core_topic") or query

        # --- Epidemiological / geographic specificity boost ---
        # If the raw query contains terms indicating population-level comparisons, geographic
        # variation, or socioeconomic disparities, force strictness >= 0.72 so the topical
        # anchor filter applies its maximum penalty on off-topic papers.
        EPIDEMIOLOGICAL_SIGNALS = {
            "disparities", "disparity", "inequality", "inequalities", "regional", "geographic",
            "prevalence", "epidemiology", "epidemiological", "variation", "distribution",
            "rural", "urban", "socioeconomic", "demographic", "population", "incidence",
            "cross-national", "cross-country", "longitudinal", "cohort",
        }
        query_lower_tokens = set(re.findall(r"[a-z]+", query.lower()))
        if query_lower_tokens & EPIDEMIOLOGICAL_SIGNALS:
            strictness = max(strictness, 0.72)

        return {
            "domain": domain,
            "core_topic": core_topic,
            "expanded_query_terms": expanded_terms,
            "method_preferences": method_preferences,
            "domain_constraints": domain_constraints,
            "year_min": year_min,
            "year_max": year_max,
            "novelty_mode": novelty_mode,
            "paper_type_preference": paper_type_preference,
            "strictness": strictness,
            "attributes": attributes,
            "expanded_terms": expanded_terms,
            "exclusions": data.get("exclusions") or [],
        }
    except Exception as e:
        logger.warning(f"Intent parse failed, using fallback: {e}")
        current_year = 2026
        try:
            from datetime import datetime, timezone
            current_year = datetime.now(timezone.utc).year
        except Exception:
            pass
        return {
            "domain": "general_empirical",
            "core_topic": query,
            "expanded_query_terms": [query],
            "method_preferences": [],
            "domain_constraints": [],
            "year_min": 2015,
            "year_max": current_year,
            "novelty_mode": "balanced",
            "paper_type_preference": [],
            "strictness": 0.5,
            "attributes": {"query": query},
            "expanded_terms": [query],
            "exclusions": [],
        }
