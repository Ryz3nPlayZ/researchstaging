# Claims Graph: Actionable Implementation Spec

## Philosophy
**Not just visualization - a tool for critical analysis.**

Every feature must answer: "How does this help the user find problems, understand structure, or communicate findings?"

---

## Core Data Model (Simplified)

```python
# Three node types, period.
class ClaimNode(Base):
    id: UUID
    paper_upload_id: UUID
    
    # The actual content
    text: str  # Exact or paraphrased claim from paper
    
    # Classification
    type: Literal["fact", "claim", "assumption", "implication"]
    # fact: "We measured X = 5" (data)
    # claim: "X causes Y" (conclusion)
    # assumption: "Assuming normal distribution..."
    # implication: "This suggests..." (inference from claim)
    
    # Source
    section: str  # abstract, intro, methods, results, discussion
    paragraph_index: int
    quote: str  # Exact text from paper
    
    # Quality (AI-scored)
    confidence: float  # 0-1, extraction confidence
    evidence_strength: Optional[float]  # 0-1, how well supported
    
    # User validation
    is_valid: Optional[bool]  # User says this is real/fake
    user_notes: Optional[str]

class RelationshipEdge(Base):
    id: UUID
    paper_upload_id: UUID
    
    source_id: UUID  # ClaimNode
    target_id: UUID  # ClaimNode
    
    type: Literal["supports", "contradicts", "assumes", "implies", "method_of"]
    
    # How was this found
    detection_method: Literal["ai_explicit", "ai_inferred", "user_added"]
    confidence: float  # AI confidence or user certainty
    
    # Evidence
    quote: Optional[str]  # Text evidence from paper

class UserAnnotation(Base):
    # Collaborative layer
    id: UUID
    node_id: Optional[UUID]
    edge_id: Optional[UUID]
    user_id: UUID
    
    type: Literal["comment", "challenge", "agreement", "note"]
    text: str
    created_at: datetime
```

---

## Feature 1: Contradiction Detection (Automatic)

### What It Does
AI automatically flags contradictions - no manual work.

### How It Works
```python
async def detect_contradictions(claims: List[ClaimNode]) -> List[Contradiction]:
    contradictions = []
    
    for i, claim1 in enumerate(claims):
        for claim2 in claims[i+1:]:
            # Check 1: Explicit contradiction words
            if has_contradiction_markers(claim1.text, claim2.text):
                contradictions.append({
                    claim1, claim2, 
                    type="explicit",
                    explanation="Claim A states X, Claim B states not-X"
                })
            
            # Check 2: Numerical contradiction
            if extract_numbers(claim1.text) and extract_numbers(claim2.text):
                if are_contradictory_numbers(claim1, claim2):
                    contradictions.append({
                        claim1, claim2,
                        type="numerical", 
                        explanation="Different values for same measurement"
                    })
            
            # Check 3: Semantic contradiction (embeddings + LLM)
            similarity = cosine_sim(claim1.embedding, claim2.embedding)
            if similarity > 0.8:  # About same topic
                contradiction_check = await llm_check_contradiction(claim1, claim2)
                if contradiction_check.is_contradiction:
                    contradictions.append({
                        claim1, claim2,
                        type="semantic",
                        explanation=contradiction_check.reasoning
                    })
    
    return contradictions
```

### UI: Contradiction Panel
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ 3 Contradictions Found                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔴 NUMERICAL                                                │
│ "Response time improved by 15%" (Results, p.4)              │
│ vs                                                          │
│ "Response time improved by 8%" (Discussion, p.6)            │
│ [Show in graph]  [Highlight in PDF]  [Mark as resolved]     │
│                                                             │
│ 🟠 LOGICAL                                                  │
│ "Our method works on all datasets" (Abstract)               │
│ vs                                                          │
│ "Method failed on Dataset C" (Results)                      │
│ [Show in graph]  [Add note]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Actionable Outputs
- **Contradiction report** (auto-generated markdown)
- **Highlight in PDF** both locations
- **Export list** for peer review

---

## Feature 2: Evidence Chain Tracing

### What It Does
Click any claim → see full support structure upstream.

### Visual: The "Stack" View
```
Selected: "Neural nets outperform SVM by 12%"

┌────────────────────────────────────────────────────────────┐
│ CONCLUSION ← You are here                                  │
│ "Neural nets outperform SVM by 12%"                        │
│ Evidence: Figure 3, p.5                                    │
├────────────────────────────────────────────────────────────┤
│ ANALYSIS (supports conclusion)                             │
│ "t-test shows p < 0.01 significance"                       │
│ Evidence: Table 2, p.5                                     │
├────────────────────────────────────────────────────────────┤
│ DATA (supports analysis)                                   │
│ "Neural net accuracy: 94%, SVM: 82%"                       │
│ Evidence: Experiment results, p.4-5                        │
├────────────────────────────────────────────────────────────┤
│ METHODOLOGY (produces data)                                │
│ "10-fold cross validation on Dataset X"                    │
│ Evidence: Methods section, p.3                             │
├────────────────────────────────────────────────────────────┤
│ ASSUMPTION (underlies methodology)                         │
│ "Dataset X is representative of real-world"                │
│ ⚠️ WEAK LINK: No evidence provided                         │
└────────────────────────────────────────────────────────────┘

[Export chain] [Challenge assumption] [Find similar chains]
```

### Reverse: Downstream Impact
```
"Assumption: Normal distribution"
  ↓ IF FALSE, AFFECTS:
    • "Statistical test validity" (MEDIUM impact)
    • "Confidence intervals" (HIGH impact)
    • "Main finding" (CRITICAL impact)
```

### Actionable Outputs
- **Critical path**: Which assumptions, if wrong, collapse the paper?
- **Weakest link**: The claim with least supporting evidence
- **Export chain**: Methods section rebuttal ("Their analysis depends on X which is unsupported...")

---

## Feature 3: Collaborative Annotation

### What It Does
Users comment on claims/relationships. Threaded discussions.

### UI: Annotation Thread
```
Selected claim: "Method scales linearly"

┌────────────────────────────────────────────────────────────┐
│ 💬 3 Annotations                                             │
├────────────────────────────────────────────────────────────┤
│ Alice (Reviewer)                    2 hours ago            │
│ ⚠️ CHALLENGE                                               │
│ "They only tested up to n=1000. Linear scaling might not   │
│ hold at production scale."                                 │
│ 👍 3  👎 0  [Reply]                                        │
│                                                            │
│   └─ Bob (Author)                 1 hour ago               │
│      "Fair point. We acknowledge this limitation in        │
│      Section 6."                                           │
│                                                            │
│ Carol (Reader)                      30 min ago             │
│ 📝 NOTE                                                     │
│ "Related: Chen et al. 2023 found superlinear scaling       │
│ at n=5000 for similar method."                            │
│ [View related paper]                                       │
└────────────────────────────────────────────────────────────┘

[Add annotation] [Filter: challenges only]
```

### Annotation Types
- **Challenge**: "This claim is wrong because..."
- **Agreement**: "Confirmed by my own work"
- **Clarification**: "What they mean is..."
- **Reference**: "Related finding in [paper]"
- **Note**: Personal reminder

### Actionable Outputs
- **Annotation summary report** (all challenges organized)
- **Consensus view**: Which claims have most agreement/disagreement
- **Export for rebuttal**: Auto-format challenges as review comments

---

## Feature 4: Export (Multiple Formats)

### Export Types

#### 1. Contradiction Report (Markdown)
```markdown
# Contradiction Analysis: paper_title.pdf

Generated: 2024-01-15

## Critical Contradictions (2)

### 1. Numerical Inconsistency
- **Location A**: Results section, p.4
- **Text**: "Accuracy improved by 15%"
- **Location B**: Discussion section, p.6  
- **Text**: "Accuracy improved by 8%"
- **Assessment**: Likely typo, but undermines credibility

### 2. Logical Conflict
...

## Recommended Actions
- [ ] Author clarification on numerical discrepancy
- [ ] Check if Dataset C exclusion affects main conclusion
```

#### 2. Evidence Chain (JSON/GraphML)
For tools like Gephi, Cytoscape.

#### 3. Annotation Summary (PDF)
Formatted as peer review comments.

#### 4. Claim Checklist (Spreadsheet)
| Claim | Type | Evidence | Confidence | Validated? | Notes |
|-------|------|----------|------------|------------|-------|
| ... | ... | ... | ... | ... | ... |

---

## UI Layout: Single Page Application

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Upload]  Paper_Name.pdf  [Status: ✓ Processed]  [Export ▼]                 │
├──────────────────┬──────────────────────────────────────────────────────────┤
│                  │                                                          │
│ CONTRADICTIONS   │         GRAPH VISUALIZATION                              │
│ ⚠️ 3 found       │                                                          │
│                  │     [Claim]──supports──▶[Claim]                         │
│ 🔴 Numerical (1) │        │                                                │
│ 🟠 Logical (2)   │        contradicts                                       │
│                  │        ▼                                                │
│ ─────────────────│     [Claim]                                              │
│                  │                                                          │
│ EVIDENCE CHAINS  │   [Pan] [Zoom] [Layout: Force/Hierarchical] [Filter ▼]  │
│ 5 chains found   │                                                          │
│                  │                                                          │
│ ▶ Main finding   │                                                          │
│ ▶ Methodology    │                                                          │
│ ▶ Limitations    │                                                          │
│                  │                                                          │
│ ─────────────────│                                                          │
│                  │                                                          │
│ ANNOTATIONS      │                                                          │
│ 💬 12 total      │                                                          │
│                  │                                                          │
│ [Filter by type] │                                                          │
│                  │                                                          │
├──────────────────┴──────────────────────────────────────────────────────────┤
│ INSPECTOR (appears when node selected)                                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Claim: "Method scales linearly"                                         │ │
│ │ Type: claim | Section: Results | Confidence: 0.89                      │ │
│ │                                                                         │ │
│ │ "Exact quote from paper..."                                             │ │
│ │ [Highlight in PDF]                                                      │ │
│ │                                                                         │ │
│ │ EVIDENCE CHAIN                    ANNOTATIONS         RELATIONSHIPS    │ │
│ │ [Stack view]                      [💬 3 comments]     [→ supports X]   │ │
│ │ [What supports this?]             [Add challenge]     [← assumes Y]    │ │
│ │ [What depends on this?]                                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
- Database schema
- PDF upload + text extraction
- Basic claim extraction (all 4 types)
- Simple graph visualization

### Phase 2: Contradictions (Week 2)
- Contradiction detection engine
- Contradiction panel UI
- Highlight contradictions in graph

### Phase 3: Evidence Chains (Week 3)
- Upstream/downstream tracing
- Stack view UI
- Weakest link detection
- Critical path analysis

### Phase 4: Collaboration (Week 4)
- Annotation system
- Threaded discussions
- User authentication for annotations

### Phase 5: Export (Week 5)
- Contradiction report (markdown)
- Evidence chain export (JSON)
- Annotation summary (PDF)
- Claim checklist (CSV)

---

## Technical Notes

### Contradiction Detection Strategy
Don't try to be perfect. Tiered approach:
1. **High confidence**: Explicit contradiction words ("however", "contrary to", "unlike") + similar topic
2. **Medium confidence**: Numerical mismatch on same metric
3. **Low confidence**: Semantic contradiction via LLM (flag for review)

### Evidence Chain Strategy
Simple rule-based first:
- Same section, adjacent paragraphs → likely supports
- "Therefore", "Thus", "This suggests" → implication
- "Assuming", "Given that" → assumption relationship
- LLM verification for ambiguous cases

### Performance
- Papers with 100+ claims: Paginate graph, show contradictions first
- Contradiction detection: O(n²) but n is small (claims per paper)
- Embeddings: Cache in database, don't recompute

---

## Success Metrics

**Tool is successful if users can:**
1. Find contradictions they missed in manual reading (test: hide AI detection, see if user finds them)
2. Trace a claim back to its evidence in < 3 clicks
3. Export a rebuttal/peer review comment in < 1 minute
4. Identify the weakest assumption in the paper

**Not success metrics:**
- Perfect extraction accuracy (impossible)
- Beautiful visualization (secondary)
- Number of features (counterproductive)

---

## Next Step

Ready to implement? I suggest:
1. Database migrations first
2. Claim extraction pipeline
3. Basic graph visualization
4. Then layer on contradictions, chains, annotations

Or do you want to adjust any of these features first?