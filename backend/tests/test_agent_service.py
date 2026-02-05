"""
Tests for agent orchestration service.
"""
import pytest
import asyncio
from backend.agent_service import AgentRouter, DocumentAgent, LiteratureAgent, MemoryAgent, GeneralAgent


# Mock LLM service
class MockLLMService:
    """Mock LLM service for testing."""

    async def generate(self, prompt: str, system_message: str = "You are a helpful assistant."):
        return f"Mock response to: {prompt[:50]}..."


@pytest.fixture
def mock_llm_service():
    """Fixture for mock LLM service."""
    return MockLLMService()


@pytest.fixture
def agent_router(mock_llm_service):
    """Fixture for agent router."""
    return AgentRouter(mock_llm_service)


@pytest.fixture
def sample_context():
    """Sample context for testing."""
    return {
        "document": {
            "title": "Test Document",
            "content": {"type": "doc"},
            "citation_style": "apa"
        },
        "claims": [
            {"text": "Claim 1", "type": "finding", "confidence": 0.9},
            {"text": "Claim 2", "type": "assertion", "confidence": 0.8}
        ],
        "findings": [
            {"type": "statistical", "summary": "Finding 1"},
            {"type": "pattern", "summary": "Finding 2"}
        ],
        "preferences": {
            "topics": ["machine learning", "nlp"],
            "domains": ["computer science"]
        }
    }


class TestAgentRouter:
    """Test agent routing."""

    def test_analyze_document_query(self, agent_router):
        """Test routing of document-related queries."""
        query = "What's in the current document?"
        agent = agent_router.analyze_query(query)
        assert agent == "document"

    def test_analyze_literature_query(self, agent_router):
        """Test routing of literature-related queries."""
        query = "What papers do we have on this topic?"
        agent = agent_router.analyze_query(query)
        assert agent == "literature"

    def test_analyze_memory_query(self, agent_router):
        """Test routing of memory-related queries."""
        query = "What did we find from our analysis?"
        agent = agent_router.analyze_query(query)
        assert agent == "memory"

    def test_analyze_general_query(self, agent_router):
        """Test routing of general queries."""
        query = "Hello! How are you?"
        agent = agent_router.analyze_query(query)
        assert agent == "general"

    @pytest.mark.asyncio
    async def test_route_to_document_agent(self, agent_router, sample_context):
        """Test actual routing to document agent."""
        query = "Summarize this document"
        response = await agent_router.route(query, sample_context)

        assert response.agent_type == "document"
        assert response.confidence > 0.5
        assert len(response.response) > 0
        assert "document" in response.context_used

    @pytest.mark.asyncio
    async def test_route_to_literature_agent(self, agent_router, sample_context):
        """Test actual routing to literature agent."""
        query = "Find papers on machine learning"
        response = await agent_router.route(query, sample_context)

        assert response.agent_type == "literature"
        assert response.confidence > 0.5
        assert len(response.response) > 0

    @pytest.mark.asyncio
    async def test_route_to_memory_agent(self, agent_router, sample_context):
        """Test actual routing to memory agent."""
        query = "What claims have we extracted?"
        response = await agent_router.route(query, sample_context)

        assert response.agent_type == "memory"
        assert response.confidence > 0.5
        assert len(response.response) > 0


class TestDocumentAgent:
    """Test DocumentAgent."""

    def test_can_handle_document_keywords(self, mock_llm_service):
        """Test document keyword detection."""
        agent = DocumentAgent(mock_llm_service)

        assert agent.can_handle("What's in this document?") > 0.8
        assert agent.can_handle("Summarize the current text") > 0.8
        assert agent.can_handle("Format this section") > 0.8
        assert agent.can_handle("Hello") < 0.5

    @pytest.mark.asyncio
    async def test_handle_with_document_context(self, mock_llm_service):
        """Test handling query with document context."""
        agent = DocumentAgent(mock_llm_service)
        context = {
            "document": {
                "title": "Test Paper",
                "citation_style": "apa"
            }
        }

        response = await agent.handle("Summarize this document", context)
        assert len(response) > 0


class TestLiteratureAgent:
    """Test LiteratureAgent."""

    def test_can_handle_literature_keywords(self, mock_llm_service):
        """Test literature keyword detection."""
        agent = LiteratureAgent(mock_llm_service)

        assert agent.can_handle("Find papers on neural networks") > 0.8
        assert agent.can_handle("What's in the literature?") > 0.8
        assert agent.can_handle("Add this citation") > 0.8
        assert agent.can_handle("Hello") < 0.5

    @pytest.mark.asyncio
    async def test_handle_with_claims_context(self, mock_llm_service):
        """Test handling query with claims context."""
        agent = LiteratureAgent(mock_llm_service)
        context = {
            "claims": [
                {"text": "ML models improve accuracy", "type": "finding", "confidence": 0.9}
            ]
        }

        response = await agent.handle("What do the papers say?", context)
        assert len(response) > 0


class TestMemoryAgent:
    """Test MemoryAgent."""

    def test_can_handle_memory_keywords(self, mock_llm_service):
        """Test memory keyword detection."""
        agent = MemoryAgent(mock_llm_service)

        assert agent.can_handle("What did we find?") > 0.8
        assert agent.can_handle("Show me the claims") > 0.8
        assert agent.can_handle("What are the key findings?") > 0.8
        assert agent.can_handle("Hello") < 0.5

    @pytest.mark.asyncio
    async def test_handle_with_findings_context(self, mock_llm_service):
        """Test handling query with findings context."""
        agent = MemoryAgent(mock_llm_service)
        context = {
            "claims": [
                {"text": "Claim 1", "type": "finding", "confidence": 0.8}
            ],
            "findings": [
                {"type": "statistical", "summary": "Significant correlation found"}
            ]
        }

        response = await agent.handle("What have we discovered?", context)
        assert len(response) > 0


class TestGeneralAgent:
    """Test GeneralAgent."""

    def test_can_handle_anything(self, mock_llm_service):
        """Test that general agent can handle any query."""
        agent = GeneralAgent(mock_llm_service)

        # Should have low confidence for everything
        assert agent.can_handle("Hello") == 0.1
        assert agent.can_handle("Help me") == 0.1
        assert agent.can_handle("What's the weather?") == 0.1

    @pytest.mark.asyncio
    async def test_handle_general_query(self, mock_llm_service):
        """Test handling general query."""
        agent = GeneralAgent(mock_llm_service)
        context = {
            "preferences": {
                "topics": ["machine learning"]
            }
        }

        response = await agent.handle("How do I write a good abstract?", context)
        assert len(response) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
