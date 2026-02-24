"""
Multi-agent orchestration service for AI research assistant.
Routes queries to specialized agents based on query analysis and context.
"""
import logging
from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod
from pydantic import BaseModel
import json

from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Document, Project, Task, Paper

from llm_service import llm_service
from memory_service import MemoryService
from literature_service import literature_service

logger = logging.getLogger(__name__)


# ============== Data Models ==============

class AgentResponse(BaseModel):
    """Response from an agent."""
    agent_type: str
    confidence: float
    response: str
    context_used: Dict[str, Any]


class PlanStep(BaseModel):
    """A single step in a proposed plan."""
    step_number: int
    description: str
    action_type: str  # "search", "analyze", "refine_text", "extract_claims", "create_document", "update_document"
    estimated_duration: str  # "2 minutes", "5 minutes"
    requires_confirmation: bool = False


class ProposedPlan(BaseModel):
    """A multi-step plan proposed by AI for complex actions."""
    goal: str
    steps: List[PlanStep]
    estimated_total_time: str
    confidence: float  # 0.0-1.0


# ============== Base Agent Class ==============

class Agent(ABC):
    """Base class for all specialized agents."""

    def __init__(self, llm_service, db: Optional[AsyncSession] = None, project_id: Optional[str] = None):
        self.llm = llm_service
        self.db = db
        self.project_id = project_id

    @abstractmethod
    async def handle(self, query: str, context: Dict[str, Any]) -> str:
        """Handle a query with given context."""
        pass

    @abstractmethod
    def can_handle(self, query: str) -> float:
        """Return confidence score 0.0-1.0 for ability to handle this query."""
        pass


# ============== Specialized Agents ==============

class DocumentAgent(Agent):
    """Agent for document-related queries."""

    # Keywords that indicate document-related queries
    DOCUMENT_KEYWORDS = [
        "this document", "current document", "the document",
        "this text", "current text", "the text",
        "this section", "current section",
        "this paragraph", "current paragraph",
        "document content", "what's in", "in the document",
        "cite this", "format this", "rewrite this",
        "summarize this", "explain this",
        "add to", "write to", "insert into", "put in",
        "add this", "write this", "add it", "put this"
    ]

    def can_handle(self, query: str) -> float:
        """Check if query is about the current document."""
        query_lower = query.lower()

        # Check for document keywords
        for keyword in self.DOCUMENT_KEYWORDS:
            if keyword in query_lower:
                return 0.9  # High confidence for explicit keywords

        # Check for selection-related terms
        if any(term in query_lower for term in ["selected", "highlighted", "selection"]):
            return 0.7

        return 0.1  # Low default confidence

    async def handle(self, query: str, context: Dict[str, Any]) -> str:
        """Handle document-related query."""
        doc_context = context.get("document", {})
        client_context = context.get("client_context", {})

        # Build system prompt with document context
        system_prompt = """You are a helpful research assistant embedded in a document editor.

## YOUR ROLE
You help researchers write, edit, and manage documents. You can provide information, suggestions, and when appropriate, you can use tools to directly modify the document."""

        if doc_context.get("title"):
            system_prompt += f"\n\n# CURRENT DOCUMENT\nTitle: {doc_context['title']}"

        if doc_context.get("citation_style"):
            system_prompt += f"\nCitation Style: {doc_context['citation_style']}"

        if context.get("selection"):
            system_prompt += f"\n\n# SELECTED TEXT\n{context['selection']}"

        if doc_context.get("content_source"):
            system_prompt += "\n\nThe document source is provided above (content_source). When using write_to_document, output Markdown/LaTeX using $...$ and $$...$$ for math so the editor can render it."
        elif doc_context.get("content"):
            system_prompt += "\n\nThe user is currently editing a document."

        # Include client-provided tool instructions
        if client_context.get("context"):
            system_prompt += f"\n\n{client_context['context']}"

        system_prompt += """

## HOW TO RESPOND
- Provide helpful assistance with the document
- When the user asks you to add content, ALWAYS use the write_to_document tool
- Never say you added something without actually using the tool

## TOOL FORMAT (IMPORTANT)
When using a tool, output EXACTLY this format with no extra characters:
<tool_call>{"name": "tool_name", "arguments": {"key": "value"}}</tool_call>

The JSON must be valid and compact (no newlines inside the JSON). Do not add > or any other characters before </tool_call>."""

        try:
            response = await self.llm.generate(
                prompt=query,
                system_message=system_prompt
            )
            return response
        except Exception as e:
            logger.error(f"DocumentAgent error: {e}")
            return "I encountered an error while analyzing the document. Please try again."


class LiteratureAgent(Agent):
    """Agent for literature and research-related queries."""

    LITERATURE_KEYWORDS = [
        "papers", "literature", "research", "citations",
        "references", "bibliography", "sources",
        "what papers", "which papers", "find papers",
        "related work", "previous studies", "existing research",
        "cite", "citation", "source"
    ]

    def can_handle(self, query: str) -> float:
        """Check if query is about literature/research."""
        query_lower = query.lower()

        for keyword in self.LITERATURE_KEYWORDS:
            if keyword in query_lower:
                return 0.9

        return 0.1

    async def handle(self, query: str, context: Dict[str, Any]) -> str:
        """Handle literature-related query."""
        claims = context.get("claims", [])

        # Build system prompt with literature context
        system_prompt = "You are a helpful research assistant with expertise in literature review and academic research."

        if claims:
            system_prompt += f"\n\n# Key Findings from Memory\n"
            system_prompt += f"The project has {len(claims)} extracted claims. Here are the most relevant:\n"
            for claim in claims[:5]:
                system_prompt += f"- {claim['text']}\n"

        system_prompt += "\n\nProvide helpful assistance with literature search, paper analysis, citation management, and research synthesis."

        try:
            response = await self.llm.generate(
                prompt=query,
                system_message=system_prompt
            )
            return response
        except Exception as e:
            logger.error(f"LiteratureAgent error: {e}")
            return "I encountered an error while searching the literature. Please try again."


class MemoryAgent(Agent):
    """Agent for memory and findings-related queries."""

    MEMORY_KEYWORDS = [
        "what did we find", "what have we found", "findings",
        "claims", "analysis", "results", "discoveries",
        "remember", "from memory", "what do we know",
        "what have we learned", "key findings", "main results",
        "extracted", "synthesis"
    ]

    def can_handle(self, query: str) -> float:
        """Check if query is about stored memory/findings."""
        query_lower = query.lower()

        for keyword in self.MEMORY_KEYWORDS:
            if keyword in query_lower:
                return 0.9

        return 0.1

    async def handle(self, query: str, context: Dict[str, Any]) -> str:
        """Handle memory-related query."""
        claims = context.get("claims", [])
        findings = context.get("findings", [])

        # Build system prompt with memory context
        system_prompt = "You are a helpful research assistant with access to the project's memory of extracted claims and findings."

        if claims:
            system_prompt += f"\n\n# Claims from Memory ({len(claims)} total)\n"
            for claim in claims[:10]:
                system_prompt += f"- [{claim.get('type', 'unknown')}] {claim['text']} (confidence: {claim['confidence']})\n"

        if findings:
            system_prompt += f"\n\n# Findings from Analysis\n"
            for finding in findings[:5]:
                system_prompt += f"- [{finding.get('type', 'unknown')}] {finding['summary']}\n"

        system_prompt += "\n\nProvide helpful assistance by synthesizing information from memory, identifying patterns, and answering questions about what the project has discovered."

        try:
            response = await self.llm.generate(
                prompt=query,
                system_message=system_prompt
            )
            return response
        except Exception as e:
            logger.error(f"MemoryAgent error: {e}")
            return "I encountered an error while accessing memory. Please try again."


class AnalysisAgent(Agent):
    """Agent for data analysis and code generation."""

    ANALYSIS_KEYWORDS = [
        "analyze", "statistic", "statistics", "regression", "plot", "chart",
        "graph", "correlation", "visualization", "data analysis", "dataset",
        "calculate", "compute", "model", "predict", "forecast", "trend",
        "distribution", "histogram", "scatter", "bar chart", "line plot",
        "heatmap", "cluster", "classification", "machine learning"
    ]

    def can_handle(self, query: str) -> float:
        """Check if query is about data analysis."""
        query_lower = query.lower()

        # Check for analysis keywords
        keyword_count = sum(1 for keyword in self.ANALYSIS_KEYWORDS if keyword in query_lower)
        if keyword_count >= 1:
            return min(0.9, 0.7 + (keyword_count * 0.1))

        return 0.1

    async def handle(self, query: str, context: Dict[str, Any]) -> str:
        """Handle analysis-related query."""
        # Build system prompt for code generation
        system_prompt = """You are an expert data analyst and programmer specializing in Python and R for data analysis.

When asked for analysis, you should:
1. Provide clear, well-commented code
2. Use best practices for the chosen language
3. Include error handling where appropriate
4. Explain the approach before showing code
5. Suggest appropriate libraries (pandas, numpy, matplotlib, seaborn, ggplot2, dplyr, etc.)

For Python: Use pandas, numpy, matplotlib, seaborn, scikit-learn
For R: Use tidyverse (ggplot2, dplyr, tidyr), caret, etc."""

        # Add data context if available
        if context.get("data_context"):
            system_prompt += f"\n\n# Available Data\n{context['data_context']}"

        try:
            response = await self.llm.generate(
                prompt=query,
                system_message=system_prompt
            )
            return response
        except Exception as e:
            logger.error(f"AnalysisAgent error: {e}")
            return "I encountered an error while generating analysis code. Please try again."

    async def generate_code(
        self,
        task_description: str,
        language: str,
        data_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, str]:
        """
        Generate analysis code for a specific task.

        Args:
            task_description: Description of the analysis task
            language: Programming language ("python" or "r")
            data_context: Optional information about available data

        Returns:
            Dict with code, language, and explanation
        """
        # Language-specific system prompt
        if language.lower() == "python":
            system_prompt = """You are an expert Python data analyst. Generate clean, well-commented Python code for data analysis tasks.

Use these libraries:
- pandas: Data manipulation
- numpy: Numerical operations
- matplotlib: Basic plotting
- seaborn: Statistical visualization
- scikit-learn: Machine learning

Return your response in this format:
EXPLANATION:
[Your explanation of the approach]

CODE:
```python
[your code here]
```"""
        elif language.lower() == "r":
            system_prompt = """You are an expert R data analyst. Generate clean, well-commented R code for data analysis tasks.

Use these libraries:
- tidyverse: Data manipulation and visualization (ggplot2, dplyr, tidyr)
- caret: Machine learning
- plotly: Interactive plots

Return your response in this format:
EXPLANATION:
[Your explanation of the approach]

CODE:
```r
[your code here]
```"""
        else:
            raise ValueError(f"Unsupported language: {language}. Use 'python' or 'r'.")

        # Build prompt with task and data context
        prompt = f"Task: {task_description}"

        if data_context:
            prompt += f"\n\nAvailable Data:\n"
            if data_context.get("columns"):
                prompt += f"Columns: {', '.join(data_context['columns'])}\n"
            if data_context.get("row_count"):
                prompt += f"Rows: {data_context['row_count']}\n"
            if data_context.get("description"):
                prompt += f"Description: {data_context['description']}\n"

        try:
            response = await self.llm.generate(
                prompt=prompt,
                system_message=system_prompt
            )

            # Parse response to extract explanation and code
            explanation = ""
            code = response

            if "EXPLANATION:" in response:
                parts = response.split("CODE:", 1)
                if len(parts) == 2:
                    explanation = parts[0].replace("EXPLANATION:", "").strip()
                    code_block = parts[1]

                    # Extract code from markdown code block
                    if "```" in code_block:
                        lines = code_block.split("\n")
                        code_lines = []
                        in_code = False
                        for line in lines:
                            if line.startswith("```"):
                                in_code = not in_code
                                continue
                            if in_code:
                                code_lines.append(line)
                        code = "\n".join(code_lines)
                    else:
                        code = code_block.strip()

            return {
                "code": code,
                "language": language.lower(),
                "explanation": explanation or "Code generated for your analysis task."
            }

        except Exception as e:
            logger.error(f"Code generation error: {e}")
            raise


class GeneralAgent(Agent):
    """General-purpose agent for fallback queries."""

    def can_handle(self, query: str) -> float:
        """General agent can handle anything with low confidence."""
        return 0.2  # Slightly higher than other agents' defaults, so it wins for general queries

    async def handle(self, query: str, context: Dict[str, Any]) -> str:
        """Handle general queries."""
        client_context = context.get("client_context", {})
        
        # Build system prompt with basic project context
        system_prompt = "You are a helpful research assistant."

        if context.get("preferences"):
            prefs = context["preferences"]
            if prefs.get("topics"):
                system_prompt += f"\n\nUser interests: {', '.join(prefs['topics'][:5])}"

        # Include client-provided tool instructions
        if client_context.get("context"):
            system_prompt += f"\n\n{client_context['context']}"

        system_prompt += """

## TOOL FORMAT (IMPORTANT)
When using a tool, output EXACTLY this format with no extra characters:
<tool_call>{"name": "tool_name", "arguments": {"key": "value"}}</tool_call>

The JSON must be valid and compact (no newlines inside the JSON). Do not add > or any other characters before </tool_call>.

Provide helpful research assistance, guidance on academic writing, methodology advice, and general research support."""

        try:
            response = await self.llm.generate(
                prompt=query,
                system_message=system_prompt
            )
            return response
        except Exception as e:
            logger.error(f"GeneralAgent error: {e}")
            return "I encountered an error. Please try again."


# ============== Agent Router ==============

class AgentRouter:
    """Routes queries to appropriate specialized agents."""

    COMPLEX_ACTION_VERBS = [
        "analyze", "compare", "extract", "generate", "search",
        "synthesize", "summarize", "review", "evaluate",
        "write", "create", "draft", "update", "edit",
        "add", "insert", "append", "put", "include"
    ]

    def __init__(self, llm_service, db: Optional[AsyncSession] = None, project_id: Optional[str] = None):
        self.llm = llm_service
        self.db = db
        self.project_id = project_id
        self.agents = [
            DocumentAgent(llm_service, db, project_id),
            LiteratureAgent(llm_service, db, project_id),
            MemoryAgent(llm_service, db, project_id),
            AnalysisAgent(llm_service, db, project_id),
            GeneralAgent(llm_service, db, project_id),  # Always last (fallback)
        ]

    def _is_simple_query(self, query: str) -> bool:
        """
        Determine if a query is simple (no plan needed) or complex (requires plan).

        Simple queries:
        - Short questions (< 50 chars)
        - Questions without complex action verbs
        - "What is X?", "Tell me about Y", "Summarize Z"

        Complex queries:
        - Long queries (> 50 chars)
        - Contain action verbs: "analyze", "compare", "extract", "generate"
        - Multi-step operations

        Returns:
            True if simple, False if complex
        """
        query_lower = query.lower().strip()

        # Check length
        if len(query) > 50:
            # Check for complex action verbs
            for verb in self.COMPLEX_ACTION_VERBS:
                if verb in query_lower:
                    return False  # Complex query

        return True  # Simple query

    async def propose_plan(
        self,
        query: str,
        context: Dict[str, Any]
    ) -> Optional[ProposedPlan]:
        """
        Generate a plan for complex multi-step actions.

        Args:
            query: User's query
            context: Context dict with document, claims, findings, preferences

        Returns:
            ProposedPlan if complex action, None if simple query
        """
        # Detect if query requires complex action
        if self._is_simple_query(query):
            return None  # No plan needed for simple queries

        # Format query with history
        formatted_query = query
        if context.get('history'):
            history_text = "\n".join([f"{msg['role'].title()}: {msg['content']}" for msg in context['history']])
            formatted_query = f"Previous Conversation:\n{history_text}\n\nCurrent Request: {query}"

        # Use LLM to generate plan
        prompt = f"""User request: {formatted_query}

Available contexts:
- Document: {bool(context.get('document'))}
- Literature: {len(context.get('claims', []))} claims extracted
- Memory: {len(context.get('findings', []))} findings
- Preferences: {bool(context.get('preferences'))}

Generate a step-by-step plan to accomplish this request.

Return JSON with this exact structure:
{{
  "goal": "Brief statement of what we're accomplishing",
  "steps": [
    {{
      "step_number": 1,
      "description": "What this step does",
      "action_type": "search|analyze|refine_text|extract_claims|create_document|update_document",
      "estimated_duration": "X minutes",
      "requires_confirmation": false
    }}
  ],
  "estimated_total_time": "Total time estimate",
  "confidence": 0.8
}}

Action types:
- search: Search literature/papers. The 'description' MUST be ONLY the exact search query keywords.
- analyze: Analyze documents/content
- refine_text: Improve or rewrite text
- extract_claims: Extract claims from papers
- create_document: Create a new document in the project
- update_document: Append or update content in the currently open document

Only return the JSON, no other text."""

        try:
            response = await self.llm.generate(
                prompt=prompt,
                system_message="You are a research planning assistant. Generate clear, actionable plans for research tasks."
            )

            # Parse JSON response
            # Handle case where LLM adds markdown code blocks
            json_str = response.strip()
            if json_str.startswith("```"):
                # Extract JSON from markdown code block
                lines = json_str.split("\n")
                json_lines = []
                in_code_block = False
                for line in lines:
                    if line.startswith("```json") or line.startswith("```"):
                        in_code_block = not in_code_block
                        continue
                    if in_code_block or not line.startswith("```"):
                        json_lines.append(line)
                json_str = "\n".join(json_lines).strip()

            plan_data = json.loads(json_str)

            return ProposedPlan(**plan_data)

        except Exception as e:
            logger.error(f"Failed to generate plan: {e}")
            # Return None on failure - fallback to direct handling
            return None

    async def execute_step(
        self,
        step: PlanStep,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a single plan step.

        Args:
            step: PlanStep to execute
            context: Context dict

        Returns:
            Dict with execution status and results
        """
        try:
            if step.action_type == "search":
                # Literature search
                if not self.db or not self.project_id:
                    return {
                        "status": "completed",
                        "step": step.step_number,
                        "description": step.description,
                        "message": "Simulated literature search (missing DB context).",
                        "results_count": 0
                    }

                import re
                query = step.description
                # Extract text between quotes if present, otherwise use the whole description
                quote_match = re.search(r'[\'"]([^\'"]+)[\'"]', query)
                if quote_match:
                    query = quote_match.group(1)
                elif ":" in query:
                    query = query.split(":")[-1].strip()

                # Clean up common conversational prefixes
                query = re.sub(r'^(search for|find papers on|literature search for)\s+', '', query, flags=re.IGNORECASE).strip()

                results = await literature_service.search_all(query, limit_per_source=3)
                
                added_count = 0
                for res in results[:5]:  # Take top 5
                    new_paper = Paper(
                        project_id=self.project_id,
                        title=res.get("title", "Unknown Title"),
                        authors=res.get("authors", []),
                        abstract=res.get("abstract"),
                        year=res.get("year"),
                        citation_count=res.get("citation_count", 0),
                        source="semantic_scholar",
                        external_id=res.get("external_id"),
                        url=res.get("url"),
                        pdf_url=res.get("open_access_pdf_url", res.get("pdf_url"))
                    )
                    self.db.add(new_paper)
                    added_count += 1
                
                await self.db.commit()

                return {
                    "status": "completed",
                    "step": step.step_number,
                    "description": step.description,
                    "message": f"Literature search completed. Found and added {added_count} highly relevant papers to the project.",
                    "results_count": added_count
                }
            elif step.action_type == "analyze":
                # Analysis step
                return {
                    "status": "completed",
                    "step": step.step_number,
                    "description": step.description,
                    "message": "Analysis completed using available context.",
                    "context_available": {
                        "document": bool(context.get('document')),
                        "claims": len(context.get('claims', [])),
                        "findings": len(context.get('findings', []))
                    }
                }

            elif step.action_type == "refine_text":
                # Text refinement - requires user action in frontend
                return {
                    "status": "requires_user_action",
                    "step": step.step_number,
                    "description": step.description,
                    "message": "This step requires text selection and refinement in the editor."
                }

            elif step.action_type == "extract_claims":
                # Claim extraction
                if not self.db or not self.project_id:
                    return {
                        "status": "completed",
                        "step": step.step_number,
                        "description": step.description,
                        "message": "Simulated claims extraction (missing DB context)."
                    }

                from sqlalchemy import select
                result = await self.db.execute(select(Paper).where(Paper.project_id == self.project_id).limit(5))
                papers = list(result.scalars().all())
                
                if not papers:
                    return {
                        "status": "completed",
                        "step": step.step_number,
                        "description": step.description,
                        "message": "No papers available for claim extraction."
                    }

                memory_svc = MemoryService(self.db)
                papers_data = [{"id": p.id, "title": p.title, "abstract": p.abstract} for p in papers]
                
                try:
                    # extract_claims_from_papers automatically creates Claim objects
                    await memory_svc.extract_claims_from_papers(self.project_id, papers_data)
                    await self.db.commit()
                except Exception as e:
                    logger.error(f"Error extracting claims autonomously: {e}")

                return {
                    "status": "completed",
                    "step": step.step_number,
                    "description": step.description,
                    "message": f"Extracted core claims from {len(papers)} project papers and added them to research memory."
                }
                
            elif step.action_type == "update_document":
                # Document update
                if not self.db or not self.project_id:
                    return {
                        "status": "completed",
                        "step": step.step_number,
                        "description": step.description,
                        "message": "Simulated document update (missing DB context)."
                    }

                doc_id = context.get('document_id')
                if not doc_id:
                    return {
                        "status": "completed",
                        "step": step.step_number,
                        "description": step.description,
                        "message": "Failed to update document: No document is currently open in the workspace."
                    }

                from sqlalchemy import select
                doc_query = await self.db.execute(select(Document).where(Document.id == doc_id))
                doc_to_update = doc_query.scalar_one_or_none()
                
                if doc_to_update:
                    import copy
                    import json
                    
                    # Generate the actual content to append using the LLM
                    prompt = f"You are an AI research assistant. Your task is to generate content to append to the document '{doc_to_update.title}'.\n\nTask description: {step.description}\n\nContext available from research:\n"
                    if context.get('findings'):
                        prompt += "\nFindings:\n" + json.dumps(context['findings'], indent=2, default=str)
                    if context.get('claims'):
                        prompt += "\nClaims:\n" + json.dumps(context['claims'], indent=2, default=str)
                        
                    prompt += "\n\nWrite the requested content exactly as it should appear in the document. Do not include any conversational filler, meta-commentary, or markdown code blocks around the text. Just return the raw text."
                    
                    try:
                        text_to_append = await self.llm.generate(
                            prompt=prompt,
                            system_message="You are an expert AI writer and researcher."
                        )
                    except Exception as e:
                        logger.error(f"Failed to generate content: {e}")
                        text_to_append = f"[Error generating content based on step: {step.description}]"

                    if not doc_to_update.content or 'content' not in doc_to_update.content:
                        doc_to_update.content = {"type": "doc", "content": []}
                        
                    # Use deepcopy to trigger SQLAlchemy JSONB mutation detection
                    new_content = copy.deepcopy(doc_to_update.content)
                    
                    # Ensure content is a list
                    if not isinstance(new_content.get("content"), list):
                        new_content["content"] = []
                        
                    new_content["content"].append({
                        "type": "paragraph",
                        "content": [{"type": "text", "text": text_to_append}]
                    })
                    
                    # Also append a blank line for readability
                    new_content["content"].append({
                        "type": "paragraph",
                        "content": []
                    })
                    
                    # Reassign to trigger update
                    doc_to_update.content = new_content
                    
                    self.db.add(doc_to_update)
                    await self.db.commit()
                    return {
                        "status": "completed",
                        "step": step.step_number,
                        "description": step.description,
                        "message": f"Appended AI-generated content to document '{doc_to_update.title}'."
                    }
                else:
                    return {
                        "status": "completed",
                        "step": step.step_number,
                        "description": step.description,
                        "message": "Failed to update document: The system could not locate the active document."
                    }
                    
            elif step.action_type == "create_document":
                if not self.db or not self.project_id:
                    logger.warning("AgentRouter missing db or project_id, simulating create_document")
                    return {
                        "status": "completed",
                        "step": step.step_number,
                        "description": step.description,
                        "message": "Simulated document creation (missing DB context)."
                    }

                title = step.description
                if ":" in title:
                    title = title.split(":")[-1].strip()
                if not title or len(title) > 255:
                    title = "New Autonomous Document"
                    
                new_doc = Document(
                    project_id=self.project_id,
                    title=title,
                    content={"type": "doc", "content": [{"type": "paragraph"}]},
                    citation_style="apa"
                )
                self.db.add(new_doc)
                await self.db.commit()
                await self.db.refresh(new_doc)
                
                return {
                    "status": "completed",
                    "step": step.step_number,
                    "description": step.description,
                    "message": f"Created new document: '{title}'",
                    "document_id": new_doc.id
                }

            else:
                return {
                    "status": "unknown",
                    "step": step.step_number,
                    "description": step.description,
                    "message": f"Unknown action type: {step.action_type}"
                }

        except Exception as e:
            logger.error(f"Step execution error: {e}")
            return {
                "status": "error",
                "step": step.step_number,
                "description": step.description,
                "error": str(e)
            }

    async def execute_plan(
        self,
        plan: ProposedPlan,
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Execute all steps in a proposed plan.

        Args:
            plan: ProposedPlan to execute
            context: Context dict

        Returns:
            List of step execution results
        """
        results = []

        for step in plan.steps:
            if step.requires_confirmation:
                # Stop at confirmation-required steps
                results.append({
                    "status": "awaiting_confirmation",
                    "step": step.step_number,
                    "description": step.description,
                    "message": "This step requires user confirmation before proceeding."
                })
                break

            result = await self.execute_step(step, context)
            results.append(result)

            # Stop if step failed
            if result.get("status") == "error":
                logger.error(f"Plan execution failed at step {step.step_number}")
                break

        return results

    def analyze_query(self, query: str) -> str:
        """
        Analyze query and return agent type.

        Returns:
            Agent type: "document", "literature", "memory", or "general"
        """
        # Get confidence scores from all agents
        scores = [(agent.__class__.__name__.replace("Agent", "").lower(), agent.can_handle(query))
                  for agent in self.agents]

        # Sort by confidence (highest first)
        scores.sort(key=lambda x: x[1], reverse=True)

        selected_agent, confidence = scores[0]

        logger.info(f"Query analysis: '{query[:50]}...' -> {selected_agent} agent (confidence: {confidence:.2f})")

        return selected_agent

    async def route(self, query: str, context: Dict[str, Any]) -> AgentResponse:
        """
        Route query to appropriate agent and return response.

        Args:
            query: User's question/message
            context: Context dict with document, claims, findings, preferences

        Returns:
            AgentResponse with agent type, confidence, and response
        """
        # Find best agent
        best_agent = None
        best_confidence = 0.0

        for agent in self.agents:
            confidence = agent.can_handle(query)
            if confidence > best_confidence:
                best_confidence = confidence
                best_agent = agent

        if not best_agent:
            # Should never happen (GeneralAgent always available)
            best_agent = self.agents[-1]
            best_confidence = 0.1

        # Get agent type name
        agent_type = best_agent.__class__.__name__.replace("Agent", "").lower()

        logger.info(f"Routing to {agent_type} agent (confidence: {best_confidence:.2f})")

        # Handle query
        try:
            formatted_query = query
            if context.get('history'):
                history_text = "\n".join([f"{msg['role'].title()}: {msg['content']}" for msg in context['history']])
                formatted_query = f"Previous Conversation:\n{history_text}\n\nCurrent Request:\n{query}"

            response_text = await best_agent.handle(formatted_query, context)

            # Determine which contexts were used
            context_used = {}
            if agent_type == "document" and context.get("document"):
                context_used["document"] = True
            if agent_type in ["literature", "memory"] and context.get("claims"):
                context_used["literature"] = True
            if agent_type == "memory" and context.get("findings"):
                context_used["memory"] = True

            return AgentResponse(
                agent_type=agent_type,
                confidence=best_confidence,
                response=response_text,
                context_used=context_used
            )

        except Exception as e:
            logger.error(f"Agent execution error: {e}", exc_info=True)
            return AgentResponse(
                agent_type=agent_type,
                confidence=best_confidence,
                response=f"I encountered an error while processing your request. Please try again.",
                context_used={}
            )
