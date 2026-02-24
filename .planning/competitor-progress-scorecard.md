# Competitor Progress Scorecard

**Date:** 2026-02-18
**Purpose:** Assess current product maturity, benchmark against likely competitors, and track progress by capability.
**Scope:** MVP execution system for research workflows (not a collaboration platform).

---

## How to Use

1. Rate each capability from `0` to `5`.
2. Enter both `Our Score` and `Competitor Estimate`.
3. Compute `Gap = Our Score - Competitor Estimate`.
4. Prioritize capabilities with the largest negative gaps that are also MVP-critical.

### Scoring Rubric (0-5)
- `0` = missing
- `1` = UI placeholder / experimental
- `2` = partial implementation, unreliable
- `3` = functional for common cases
- `4` = robust and production-ready
- `5` = category-leading

---

## Capability Benchmark

| Capability | Weight | Our Score | Competitor A | Competitor B | Competitor C | Gap vs A | Gap vs B | Gap vs C | Notes / Evidence |
|------------|--------|-----------|--------------|--------------|--------------|----------|----------|----------|------------------|
| Dashboard trustworthiness (grounded UI, no mock data) | 8 | 3 | 4 | 3 | 2 | -1 | 0 | 1 | Grounded hero redesign complete and static trend fallbacks removed; needs runtime QA evidence for full closure. |
| Project/workflow reliability (create→plan→execute) | 10 | 3 | 4 | 3 | 3 | -1 | 0 | 0 | Core flow exists; create-doc redirect now implemented. |
| Document editor quality (MVP subset) | 8 | 2 | 4 | 2 | 2 | -2 | 0 | 0 | Editor functional but below serious writing-tool quality target. |
| Literature retrieval quality | 8 | 3 | 2 | 5 | 4 | 1 | -2 | -1 | Integrated APIs exist; retrieval quality needs empirical benchmark run. |
| File management reliability | 7 | 2 | 4 | 1 | 1 | -2 | 1 | 1 | Upload/list/preview paths exist but reliability not fully verified end-to-end. |
| Analysis execution capability | 7 | 2 | 2 | 1 | 1 | 0 | 1 | 1 | Analysis execution endpoint exists; needs stronger UX and stability validation. |
| Agentic execution (multi-step tools) | 10 | 2 | 3 | 4 | 3 | -1 | -2 | -1 | Worker/orchestration foundation present; limited visible agent transparency. |
| Provenance visibility (claim→source) | 10 | 2 | 2 | 3 | 4 | 0 | -1 | -2 | Claim data model supports source fields; claim-level UI linking remains limited. |
| Auditability (execution logs/traceability) | 10 | 3 | 3 | 2 | 3 | 0 | 1 | 0 | Added execution-log API + overview audit trail panel in this iteration. |
| Export quality (PDF/DOCX/citations) | 5 | 3 | 4 | 2 | 1 | -1 | 1 | 2 | Export endpoints exist; production quality still unverified. |
| Real-time status clarity (single-user updates) | 4 | 2 | 3 | 2 | 1 | -1 | 0 | 1 | WebSocket path exists; UX clarity and reliability need focused QA. |
| Performance baseline (load/interaction) | 7 | 2 | 4 | 4 | 3 | -2 | -2 | -1 | No recent benchmark data captured against defined targets yet. |
| Accessibility baseline | 4 | 1 | 3 | 2 | 2 | -2 | -1 | -1 | Accessibility audit not yet complete. |
| Browser + responsive reliability | 2 | 2 | 4 | 3 | 2 | -2 | -1 | 0 | Baseline responsive support present, but cross-browser verification pending. |

---

## Suggested Competitor Set (Adjustable)

- **Competitor A:** Notion AI / Notion docs workflows
- **Competitor B:** Perplexity research workflows
- **Competitor C:** Elicit / connected academic research tooling

> Replace with your chosen competitors and keep the set stable across monthly assessments.

---

## Weighted Progress Summary

Use this section after filling in scores.

| Metric | Value |
|--------|-------|
| Weighted Our Score | 2.39 |
| Weighted Competitor A Score | 3.22 |
| Weighted Competitor B Score | 2.74 |
| Weighted Competitor C Score | 2.50 |
| Largest Negative Gap Area | Dashboard trustworthiness, editor quality, performance baseline |
| Most Improved Area (since last review) | Dashboard trustworthiness + auditability |
| Current MVP Readiness (Low/Medium/High) | Medium-Low |

**Formula:**
- Weighted Score = `sum(capability_score × weight) / sum(weights)`

---

## MVP Critical Gating

MVP cannot be considered ready unless all of the below are at least `3`:

- Project/workflow reliability
- Agentic execution (multi-step tools)
- Provenance visibility
- Auditability
- Document editor quality (MVP subset)

If any are `<3`, open/continue remediation tasks in:
- [.planning/ux-improvement-plan.md](.planning/ux-improvement-plan.md)
- [.planning/feature-verification-checklist.md](.planning/feature-verification-checklist.md)

---

## Monthly Checkpoint Log

| Date | Owner | Key Changes Since Last Checkpoint | Weighted Score Delta | Decision |
|------|-------|-----------------------------------|----------------------|----------|
| 2026-02-18 | Copilot | Added create-doc redirect, completed grounded dashboard hero redesign, reduced hardcoded content, exposed execution logs in API/UI | +0.30 (estimated) | Continue remaining P0 provenance/source-linking and then move to P1 |

---

## Immediate Next Actions

- Complete P0 verification in the checklist with evidence links.
- Fill initial baseline scores for us + 3 competitors.
- Prioritize top 3 negative gaps where capability is MVP-critical.
- Re-score after each milestone release.
