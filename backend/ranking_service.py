"""Deterministic multi-signal ranking for literature search v2."""

import logging
import math
import re
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

BASE_WEIGHTS = {
    "cross_encoder": 0.30,
    "dense_similarity": 0.20,
    "citation_authority": 0.15,
    "graph_proximity": 0.15,
    "lexical_score": 0.10,
    "attribute_alignment": 0.10,
}

FOUNDATIONAL_WEIGHTS = {
    "cross_encoder": 0.25,
    "dense_similarity": 0.15,
    "citation_authority": 0.25,
    "graph_proximity": 0.15,
    "lexical_score": 0.10,
    "attribute_alignment": 0.10,
}

RECENT_WEIGHTS = {
    "cross_encoder": 0.35,
    "dense_similarity": 0.25,
    "citation_authority": 0.10,
    "graph_proximity": 0.10,
    "lexical_score": 0.10,
    "attribute_alignment": 0.10,
}

STOP_TOKENS = {
    "the", "and", "for", "with", "from", "into", "about", "around", "toward", "towards",
    "study", "studies", "analysis", "approach", "approaches", "method", "methods", "model", "models",
    "data", "using", "based", "effects", "effect", "impact", "impacts", "across", "among", "between",
    "of", "in", "on", "to", "by", "via", "an", "a", "is", "are", "be", "as", "at", "or",
}

# Truly ambiguous words that shouldn't be used as topical anchors.
# NOTE: epidemiological/geographic specificity terms (regional, disparities, inequality, etc.)
# are intentionally NOT listed here — they are often the most discriminating tokens in a query.
AMBIGUOUS_TOPIC_TOKENS = {
    "trend", "trends", "factor", "factors",
}


def _normalize_minmax(values: List[float]) -> List[float]:
    if not values:
        return []
    lower = min(values)
    upper = max(values)
    if upper <= lower:
        return [0.0 for _ in values]
    return [(value - lower) / (upper - lower) for value in values]


def _tokenize(text: str) -> List[str]:
    return [token for token in re.findall(r"[a-z0-9]+", (text or "").lower()) if len(token) > 1]


def _extract_anchor_terms(query_text: str) -> List[str]:
    anchors: List[str] = []
    seen = set()
    for token in _tokenize(query_text):
        if token in STOP_TOKENS or token in AMBIGUOUS_TOPIC_TOKENS or len(token) < 4:
            continue
        if token in seen:
            continue
        seen.add(token)
        anchors.append(token)
    return anchors[:8]


def _sigmoid(value: float) -> float:
    return 1.0 / (1.0 + math.exp(-value))


def _bm25_like(query_tokens: List[str], doc_tokens: List[str], doc_freq: Dict[str, int], num_docs: int, avg_doc_len: float) -> float:
    if not query_tokens or not doc_tokens or num_docs <= 0:
        return 0.0
    k1 = 1.2
    b = 0.75
    tf = Counter(doc_tokens)
    score = 0.0
    doc_len = len(doc_tokens)
    for token in query_tokens:
        if token not in tf:
            continue
        df = doc_freq.get(token, 0)
        idf = math.log(1 + (num_docs - df + 0.5) / (df + 0.5))
        numerator = tf[token] * (k1 + 1)
        denominator = tf[token] + k1 * (1 - b + b * (doc_len / max(avg_doc_len, 1e-9)))
        score += idf * (numerator / max(denominator, 1e-9))
    return score


def _dense_similarity(query_tokens: List[str], doc_tokens: List[str]) -> float:
    query_set = set(query_tokens)
    doc_set = set(doc_tokens)
    if not query_set or not doc_set:
        return 0.0
    intersection = len(query_set.intersection(doc_set))
    union = len(query_set.union(doc_set))
    return intersection / max(union, 1)


def _cross_encoder_score(query_text: str, doc_text: str) -> float:
    query_tokens = _tokenize(query_text)
    doc_tokens = _tokenize(doc_text)
    if not query_tokens or not doc_tokens:
        return 0.0
    overlap = len(set(query_tokens).intersection(set(doc_tokens))) / max(len(set(query_tokens)), 1)
    phrase_bonus = 0.0
    lowered_doc = doc_text.lower()
    for token in query_tokens[:12]:
        if token in lowered_doc:
            phrase_bonus += 0.02
    raw_logit = (2.0 * overlap) + min(0.4, phrase_bonus) - 0.8
    return _sigmoid(raw_logit)


def _attribute_alignment(intent: Dict[str, Any], text: str) -> float:
    tags: List[str] = []
    tags.extend([str(item) for item in (intent.get("method_preferences") or []) if item])
    tags.extend([str(item) for item in (intent.get("paper_type_preference") or []) if item])
    attributes = intent.get("attributes") or {}
    tags.extend([str(value) for value in attributes.values() if value])
    tags = [tag.strip().lower() for tag in tags if str(tag).strip()]
    if not tags:
        # No method/type constraints — the weight contributes equally to all papers.
        return 1.0
    lowered = (text or "").lower()
    matched = 0
    for tag in tags:
        words = [word for word in tag.split() if len(word) > 2]
        if tag in lowered or any(word in lowered for word in words):
            matched += 1
    return matched / max(len(tags), 1)


def _graph_proximity(paper: Dict[str, Any], seed_reference_counter: Counter) -> float:
    refs = paper.get("reference_ids") or []
    if not refs or not seed_reference_counter:
        return 0.0
    score = 0.0
    for ref in refs:
        score += float(seed_reference_counter.get(ref, 0))
    return score


def _anchor_hits(doc_tokens: List[str], anchors: List[str]) -> int:
    if not anchors or not doc_tokens:
        return 0
    doc_set = set(doc_tokens)
    return sum(1 for token in anchors if token in doc_set)


def _get_weights(novelty_mode: str) -> Dict[str, float]:
    if novelty_mode == "foundational":
        return FOUNDATIONAL_WEIGHTS
    if novelty_mode == "recent":
        return RECENT_WEIGHTS
    return BASE_WEIGHTS


def _percentile(values: List[float], percentile: float) -> float:
    if not values:
        return 0.0
    sorted_values = sorted(values)
    index = int(round((len(sorted_values) - 1) * percentile))
    index = max(0, min(index, len(sorted_values) - 1))
    return sorted_values[index]


def compute_ranking(
    papers: List[Dict[str, Any]],
    intent: Dict[str, Any],
    citation_counts_by_doi: Optional[Dict[str, int]] = None,
    min_score_threshold: float = 0.30,
) -> List[Dict[str, Any]]:
    """Compute deterministic scores and return ranked papers with explainability."""
    if not papers:
        return []

    query_text = str(intent.get("core_topic") or intent.get("attributes", {}).get("query") or "")
    expanded_terms = intent.get("expanded_query_terms") or intent.get("expanded_terms") or []
    query_terms = _tokenize(query_text + " " + " ".join([str(term) for term in expanded_terms]))
    if not query_terms:
        query_terms = _tokenize(query_text)

    novelty_mode = str(intent.get("novelty_mode", "balanced")).lower()
    weights = _get_weights(novelty_mode)
    strictness = float(intent.get("strictness", 0.5) or 0.5)
    strictness = max(0.0, min(1.0, strictness))
    year_min = intent.get("year_min")
    year_max = intent.get("year_max")
    exclusions = [str(item).strip().lower() for item in (intent.get("exclusions") or []) if str(item).strip()]

    anchor_terms = _extract_anchor_terms(query_text)
    n_anchors = len(anchor_terms)
    # Require at least 40% of anchor tokens to appear in the doc, floor 2 if there are any anchors.
    min_anchor_hits = max(2, math.ceil(n_anchors * 0.4)) if n_anchors > 0 else 1
    if strictness > 0.65:
        min_anchor_hits = min(3, min_anchor_hits + 1)

    doc_tokens_per_paper: List[List[str]] = []
    document_frequency: Counter = Counter()
    dense_scores_raw: List[float] = []
    attribute_scores_raw: List[float] = []
    cross_scores_raw: List[float] = []
    bm25_raw: List[float] = []
    citation_log_raw: List[float] = []
    graph_raw: List[float] = []
    paper_records: List[Tuple[Dict[str, Any], Dict[str, float], List[str]]] = []

    seed_papers = papers[: min(10, len(papers))]
    seed_reference_counter: Counter = Counter()
    for seed in seed_papers:
        for ref in (seed.get("reference_ids") or [])[:40]:
            seed_reference_counter[ref] += 1

    for paper in papers:
        text = f"{paper.get('title') or ''} {paper.get('abstract') or ''}"
        tokens = _tokenize(text)
        doc_tokens_per_paper.append(tokens)
        for token in set(tokens):
            document_frequency[token] += 1

    avg_doc_len = sum(len(tokens) for tokens in doc_tokens_per_paper) / max(len(doc_tokens_per_paper), 1)
    num_docs = len(doc_tokens_per_paper)

    for index, paper in enumerate(papers):
        text = f"{paper.get('title') or ''} {paper.get('abstract') or ''}"
        tokens = doc_tokens_per_paper[index]

        dense = _dense_similarity(query_terms, tokens)
        cross = _cross_encoder_score(query_text or " ".join(query_terms), text)
        lexical = _bm25_like(query_terms, tokens, document_frequency, num_docs, avg_doc_len)
        attribute = _attribute_alignment(intent, text)

        citations = paper.get("citation_count") or 0
        doi = paper.get("doi")
        if doi and citation_counts_by_doi:
            doi_key = doi.strip().lower().replace("https://doi.org/", "")
            if doi_key in citation_counts_by_doi:
                citations = citation_counts_by_doi[doi_key]
        citation_log = math.log(1 + max(int(citations), 0))

        year = paper.get("year")
        current_year = datetime.now(timezone.utc).year
        recency_score = math.exp(-(current_year - int(year)) / 10.0) if year else 0.5

        graph = _graph_proximity(paper, seed_reference_counter)

        dense_scores_raw.append(dense)
        cross_scores_raw.append(cross)
        bm25_raw.append(lexical)
        attribute_scores_raw.append(attribute)
        citation_log_raw.append(citation_log)
        graph_raw.append(graph)

        paper_records.append((paper, {
            "dense_similarity": dense,
            "cross_encoder": cross,
            "lexical_score_raw": lexical,
            "attribute_alignment": attribute,
            "citation_authority_raw": citation_log,
            "graph_proximity_raw": graph,
            "recency_score": round(recency_score, 4),
        }, tokens))

    lexical_norm = [value / max(max(bm25_raw), 1e-9) for value in bm25_raw]
    citation_norm = _normalize_minmax(citation_log_raw)
    graph_norm = [value / max(max(graph_raw), 1e-9) for value in graph_raw]

    dense_cutoff = _percentile(dense_scores_raw, 0.3)
    filtered: List[Dict[str, Any]] = []
    dropped = {"year": 0, "strict_alignment": 0, "dense_percentile": 0, "topical_anchor": 0, "exclusion": 0}

    for index, (paper, score_map, tokens) in enumerate(paper_records):
        text = f"{paper.get('title') or ''} {paper.get('abstract') or ''}".lower()

        if exclusions and any(term in text for term in exclusions):
            dropped["exclusion"] += 1
            continue

        year = paper.get("year")
        if isinstance(year_min, int) and year is not None and year < year_min:
            dropped["year"] += 1
            continue
        if isinstance(year_max, int) and year is not None and year > year_max:
            dropped["year"] += 1
            continue

        if anchor_terms and _anchor_hits(tokens, anchor_terms) < min_anchor_hits:
            dropped["topical_anchor"] += 1
            continue

        if strictness > 0.7 and score_map["attribute_alignment"] < 0.2:
            dropped["strict_alignment"] += 1
            continue

        if score_map["dense_similarity"] < dense_cutoff:
            dropped["dense_percentile"] += 1
            continue

        normalized = {
            "dense_similarity": score_map["dense_similarity"],
            "cross_encoder": score_map["cross_encoder"],
            "lexical_score": lexical_norm[index],
            "attribute_alignment": score_map["attribute_alignment"],
            "citation_authority": citation_norm[index],
            "graph_proximity": graph_norm[index],
        }

        final_score = (
            weights["cross_encoder"] * normalized["cross_encoder"]
            + weights["dense_similarity"] * normalized["dense_similarity"]
            + weights["citation_authority"] * normalized["citation_authority"]
            + weights["graph_proximity"] * normalized["graph_proximity"]
            + weights["lexical_score"] * normalized["lexical_score"]
            + weights["attribute_alignment"] * normalized["attribute_alignment"]
        )

        filtered.append({
            **paper,
            "relevance_breakdown": {
                "cross_encoder": round(normalized["cross_encoder"], 4),
                "dense_similarity": round(normalized["dense_similarity"], 4),
                "citation_authority": round(normalized["citation_authority"], 4),
                "graph_proximity": round(normalized["graph_proximity"], 4),
                "lexical_score": round(normalized["lexical_score"], 4),
                "attribute_alignment": round(normalized["attribute_alignment"], 4),
                "recency_score": score_map["recency_score"],
                "anchor_hits": _anchor_hits(tokens, anchor_terms),
                "min_anchor_hits": min_anchor_hits,
                "final_score": round(final_score, 6),
                "strictness": strictness,
                "dense_cutoff": round(dense_cutoff, 6),
            },
            "final_score": round(final_score, 6),
        })

    filtered.sort(key=lambda item: item["final_score"], reverse=True)

    # Apply minimum score floor — do not surface papers below the threshold.
    pre_floor = len(filtered)
    filtered = [item for item in filtered if item["final_score"] >= min_score_threshold]
    dropped["score_floor"] = pre_floor - len(filtered)

    for item in filtered:
        item["ranking_meta"] = {
            "weights": weights,
            "dropped": dropped,
            "novelty_mode": novelty_mode,
            "min_score_threshold": min_score_threshold,
        }

    return filtered
