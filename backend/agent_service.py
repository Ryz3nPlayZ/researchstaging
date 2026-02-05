"""
Multi-agent orchestration service for AI research assistant.
Routes queries to specialized agents based on query analysis and context.
"""
import logging
from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod
from pydantic import BaseModel

from llm_service import llm_service
from memory_service import MemoryService

logger = logging.getLogger(__name__)


# ============== Data Models ==============

class AgentResponse(BaseModel):
    """Response from an agent."""
    agent_type: str
    confidence: float
    response: str
    context_used: Dict[str, Any]


# ============== Base Agent Class ==============

class Agent(ABC):
    """Base class for all specialized agents."""

    def __init__(self, llm_service):
        self.llm = llm_service

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
        "summarize this", "explain this"
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

        # Build system prompt with document context
        system_prompt = "You are a helpful research assistant working with a document."

        if doc_context.get("title"):
            system_prompt += f"\n\n# Current Document\nTitle: {doc_context['title']}"

        if doc_context.get("citation_style"):
            system_prompt += f"\nCitation Style: {doc_context['citation_style']}"

        if context.get("selection"):
            system_prompt += f"\n\n# Selected Text\n{context['selection']}"

        # For TipTap content, we'll just note it exists
        # (Full content would be too large for prompt)
        if doc_context.get("content"):
            system_prompt += "\n\nThe user is working with a document in the editor."

        system_prompt += "\n\nProvide helpful assistance with the document, including editing, formatting, citations, and content suggestions."

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


class GeneralAgent(Agent):
    """General-purpose agent for fallback queries."""

    def can_handle(self, query: str) -> float:
        """General agent can handle anything with low confidence."""
        return 0.1  # Always available but low priority

    async def handle(self, query: str, context: Dict[str, Any]) -> str:
        """Handle general queries."""
        # Build system prompt with basic project context
        system_prompt = "You are a helpful research assistant."

        if context.get("preferences"):
            prefs = context["preferences"]
            if prefs.get("topics"):
                system_prompt += f"\n\nUser interests: {', '.join(prefs['topics'][:5])}"

        system_prompt += "\n\nProvide helpful research assistance, guidance on academic writing, methodology advice, and general research support."

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

    def __init__(self, llm_service):
        self.llm = llm_service
        self.agents = [
            DocumentAgent(llm_service),
            LiteratureAgent(llm_service),
            MemoryAgent(llm_service),
            GeneralAgent(llm_service),  # Always last (fallback)
        ]

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
            response_text = await best_agent.handle(query, context)

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
