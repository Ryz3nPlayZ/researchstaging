"""
LLM Service for text generation tasks.
Supports multiple LLM providers with fallback logic:
- OpenAI: GPT-4.1-mini
- Gemini: 2.5 Flash (primary) → 2.5 Flash Lite → 3.0 Flash Preview
- Mistral: Mistral Large 3
- Groq: Llama 3.3 70B
- OpenRouter: Configurable model
"""
import os
import logging
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Model configuration from environment
MODELS = {
    "openai": {
        "api_key": os.environ.get("OPENAI_API_KEY"),
        "model": os.environ.get("OPENAI_MODEL", "gpt-4.1-mini"),
        "enabled": bool(os.environ.get("OPENAI_API_KEY"))
    },
    "gemini": {
        "api_key": os.environ.get("GEMINI_API_KEY"),
        "models": [
            os.environ.get("GEMINI_MODEL_PRIMARY", "gemini-2.5-flash"),
            os.environ.get("GEMINI_MODEL_FALLBACK_1", "gemini-2.5-flash-lite"),
            os.environ.get("GEMINI_MODEL_FALLBACK_2", "gemini-3.0-flash-preview")
        ],
        "enabled": bool(os.environ.get("GEMINI_API_KEY"))
    },
    "mistral": {
        "api_key": os.environ.get("MISTRAL_API_KEY"),
        "model": os.environ.get("MISTRAL_MODEL", "mistral-large-3"),
        "enabled": bool(os.environ.get("MISTRAL_API_KEY"))
    },
    "groq": {
        "api_key": os.environ.get("GROQ_API_KEY"),
        "model": os.environ.get("GROQ_MODEL", "llama-3.3-70b"),
        "enabled": bool(os.environ.get("GROQ_API_KEY"))
    },
    "openrouter": {
        "api_key": os.environ.get("OPENROUTER_API_KEY"),
        "model": os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b"),
        "enabled": bool(os.environ.get("OPENROUTER_API_KEY"))
    }
}

# Provider order for automatic selection
PROVIDER_ORDER = ["openai", "gemini", "mistral", "groq", "openrouter"]


class LLMService:
    """Service for LLM-powered text generation with multiple providers."""

    def __init__(self):
        self._openai_client = None
        self._genai_client = None
        self._mistral_client = None
        self._groq_client = None
        self._openrouter_client = None

        # Check which providers are available
        self.available_providers = [p for p in PROVIDER_ORDER if MODELS[p]["enabled"]]

        if not self.available_providers:
            logger.warning("No LLM providers configured. Please add API keys to .env file")

    def _get_openai_client(self):
        """Lazy load OpenAI client."""
        if self._openai_client is None and MODELS["openai"]["enabled"]:
            from openai import AsyncOpenAI
            self._openai_client = AsyncOpenAI(api_key=MODELS["openai"]["api_key"])
        return self._openai_client

    def _get_genai_client(self):
        """Lazy load Google Generative AI client."""
        if self._genai_client is None and MODELS["gemini"]["enabled"]:
            import google.generativeai as genai
            genai.configure(api_key=MODELS["gemini"]["api_key"])
            self._genai_client = genai
        return self._genai_client

    def _get_mistral_client(self):
        """Lazy load Mistral client."""
        if self._mistral_client is None and MODELS["mistral"]["enabled"]:
            from mistralai.async import MistralAsyncClient
            self._mistral_client = MistralAsyncClient(api_key=MODELS["mistral"]["api_key"])
        return self._mistral_client

    def _get_groq_client(self):
        """Lazy load Groq client."""
        if self._groq_client is None and MODELS["groq"]["enabled"]:
            from groq import AsyncGroq
            self._groq_client = AsyncGroq(api_key=MODELS["groq"]["api_key"])
        return self._groq_client

    def _get_openrouter_client(self):
        """Lazy load OpenRouter client."""
        if self._openrouter_client is None and MODELS["openrouter"]["enabled"]:
            from openai import AsyncOpenAI
            self._openrouter_client = AsyncOpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=MODELS["openrouter"]["api_key"]
            )
        return self._openrouter_client

    async def generate(
        self,
        prompt: str,
        system_message: str = "You are a helpful research assistant.",
        provider: Optional[str] = None,
        model: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> str:
        """
        Generate text using specified or auto-selected LLM provider.

        Args:
            prompt: The user prompt
            system_message: System message for context
            provider: Specific provider to use (openai, gemini, mistral, groq, openrouter)
            model: Specific model to use (overrides default)
            session_id: Optional session ID for conversation continuity

        Returns:
            Generated text response
        """
        if not self.available_providers:
            raise ValueError("No LLM providers configured. Please add API keys to .env file")

        # Use specified provider or auto-select first available
        providers_to_try = [provider] if provider and provider in self.available_providers else self.available_providers

        last_error = None
        for prov in providers_to_try:
            try:
                if prov == "openai":
                    return await self._generate_openai(prompt, system_message, model)
                elif prov == "gemini":
                    return await self._generate_gemini(prompt, system_message, model)
                elif prov == "mistral":
                    return await self._generate_mistral(prompt, system_message, model)
                elif prov == "groq":
                    return await self._generate_groq(prompt, system_message, model)
                elif prov == "openrouter":
                    return await self._generate_openrouter(prompt, system_message, model)
            except Exception as e:
                last_error = e
                logger.warning(f"Failed to generate with {prov}: {e}")
                continue

        raise ValueError(f"All LLM providers failed. Last error: {last_error}")

    async def _generate_openai(
        self,
        prompt: str,
        system_message: str,
        model: Optional[str] = None
    ) -> str:
        """Generate using OpenAI GPT-4.1-mini."""
        client = self._get_openai_client()
        model_name = model or MODELS["openai"]["model"]

        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4096
        )

        return response.choices[0].message.content

    async def _generate_gemini(
        self,
        prompt: str,
        system_message: str,
        model: Optional[str] = None
    ) -> str:
        """Generate using Gemini with automatic fallback."""
        client = self._get_genai_client()

        # Try models in order
        models_to_try = [model] if model else MODELS["gemini"]["models"]

        for model_name in models_to_try:
            try:
                genai_model = client.GenerativeModel(model_name)
                full_prompt = f"{system_message}\n\n{prompt}"
                response = await genai_model.generate_content_async(full_prompt)
                return response.text
            except Exception as e:
                logger.warning(f"Gemini model {model_name} failed: {e}")
                continue

        raise ValueError("All Gemini models failed")

    async def _generate_mistral(
        self,
        prompt: str,
        system_message: str,
        model: Optional[str] = None
    ) -> str:
        """Generate using Mistral Large 3."""
        client = self._get_mistral_client()
        model_name = model or MODELS["mistral"]["model"]

        response = await client.chat.complete(
            model=model_name,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4096
        )

        return response.choices[0].message.content

    async def _generate_groq(
        self,
        prompt: str,
        system_message: str,
        model: Optional[str] = None
    ) -> str:
        """Generate using Groq Llama 3.3 70B."""
        client = self._get_groq_client()
        model_name = model or MODELS["groq"]["model"]

        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4096
        )

        return response.choices[0].message.content

    async def _generate_openrouter(
        self,
        prompt: str,
        system_message: str,
        model: Optional[str] = None
    ) -> str:
        """Generate using OpenRouter."""
        client = self._get_openrouter_client()
        model_name = model or MODELS["openrouter"]["model"]

        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4096
        )

        return response.choices[0].message.content

    async def summarize_paper(
        self,
        title: str,
        abstract: str,
        provider: Optional[str] = None
    ) -> str:
        """Generate a concise summary of a paper."""
        system_message = """You are a research assistant specialized in academic paper analysis.
Your task is to provide clear, accurate, and concise summaries of research papers.
Focus on key findings, methodology, and implications."""

        prompt = f"""Summarize the following research paper in 2-3 paragraphs:

Title: {title}

Abstract: {abstract}

Provide a summary that covers:
1. Main research question/objective
2. Key methodology or approach
3. Main findings and their significance"""

        return await self.generate(prompt, system_message, provider=provider)

    async def synthesize_literature(
        self,
        research_goal: str,
        papers: list,
        provider: Optional[str] = None
    ) -> str:
        """Synthesize multiple papers into a coherent literature review section."""
        system_message = """You are an expert academic writer specializing in literature synthesis.
Your task is to create coherent, well-organized literature reviews that identify themes,
gaps, and connections across multiple research papers."""

        papers_text = "\n\n".join([
            f"Paper {i+1}: {p.get('title', 'Unknown')}\n"
            f"Authors: {', '.join(p.get('authors', []))}\n"
            f"Year: {p.get('year', 'N/A')}\n"
            f"Summary: {p.get('summary', p.get('abstract', 'No summary available'))}"
            for i, p in enumerate(papers[:10])  # Limit to 10 papers
        ])

        prompt = f"""Create a literature review synthesis for the following research goal:

Research Goal: {research_goal}

Relevant Papers:
{papers_text}

Please write a comprehensive literature synthesis that:
1. Identifies main themes and findings across the papers
2. Notes areas of consensus and disagreement
3. Highlights methodological approaches
4. Identifies gaps in the current research
5. Suggests how these findings relate to the research goal

Format the output with clear sections and academic writing style."""

        return await self.generate(prompt, system_message, provider=provider)

    async def draft_section(
        self,
        research_goal: str,
        section_type: str,
        context: str,
        provider: Optional[str] = None
    ) -> str:
        """Draft a specific section of a research document."""
        system_message = """You are an expert academic writer with extensive experience
in research paper composition. Write in a clear, formal academic style."""

        prompt = f"""Draft the {section_type} section for a research document.

Research Goal: {research_goal}

Context and Materials:
{context}

Write a well-structured {section_type} section that is appropriate for academic publication.
Use clear topic sentences, proper transitions, and maintain a formal academic tone."""

        return await self.generate(prompt, system_message, provider=provider)

    async def generate_research_plan(
        self,
        research_goal: str,
        output_type: str,
        audience: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate a research execution plan."""
        system_message = """You are a research planning expert. Your task is to create
structured research execution plans that are practical and achievable."""

        audience_text = f"Target Audience: {audience}" if audience else ""

        prompt = f"""Create a detailed research execution plan for the following:

Research Goal: {research_goal}
Output Type: {output_type}
{audience_text}

Provide a JSON response with the following structure:
{{
    "title": "Proposed title for the research output",
    "phases": [
        {{
            "name": "Phase name",
            "description": "What this phase accomplishes",
            "tasks": [
                {{
                    "name": "Task name",
                    "type": "literature_search|summarization|synthesis|drafting",
                    "description": "Task description"
                }}
            ]
        }}
    ],
    "estimated_papers_to_review": number,
    "key_search_terms": ["term1", "term2", ...]
}}

Focus on literature review and synthesis tasks. Do not include tasks requiring external data collection or experiments."""

        # Use OpenAI for structured JSON output if available
        response = await self.generate(
            prompt,
            system_message,
            provider="openai" if "openai" in self.available_providers else None
        )

        # Try to parse JSON from response
        import json
        try:
            # Find JSON in response
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(response[start:end])
        except json.JSONDecodeError:
            logger.warning("Could not parse research plan JSON, returning raw response")

        return {"raw_response": response}


# Singleton instance
llm_service = LLMService()
