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
            import importlib
            mistralai_async = importlib.import_module('mistralai.async')
            MistralAsyncClient = mistralai_async.MistralAsyncClient
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
        system_message = """You are an expert academic research planner with extensive experience in designing rigorous, systematic literature reviews and research projects. Your plans are known for being:

1. **Methodologically Sound**: Following established research protocols (PRISMA, Cochrane, etc.)
2. **Comprehensive**: Covering all necessary aspects of high-quality research
3. **Actionable**: Breaking down complex research into clear, executable steps
4. **Quality-Focused**: Including validation, synthesis, and peer review at every stage
5. **Audience-Appropriate**: Tailoring depth and terminology to the target audience

Create detailed, phased research execution plans that a graduate student or research team could follow directly."""

        audience_text = f"Target Audience: {audience}" if audience else ""
        output_guidance = self._get_output_type_guidance(output_type)

        prompt = f"""Create a comprehensive, methodologically rigorous research execution plan for:

**Research Goal**: {research_goal}
**Output Type**: {output_type.replace('_', ' ').title()}
{audience_text}

{output_guidance}

**IMPORTANT REQUIREMENTS**:

1. **Phase Structure**: Create 4-6 sequential phases that cover:
   - **Discovery Phase**: Comprehensive literature search across multiple databases (Semantic Scholar, Google Scholar, arXiv, PubMed if relevant)
   - **Screening & Selection**: Title/abstract screening, full-text review with inclusion/exclusion criteria
   - **Deep Analysis**: Critical appraisal, quality assessment, detailed extraction
   - **Synthesis**: Thematic analysis, identifying patterns, contradictions, gaps
   - **Validation**: Cross-checking findings, methodological triangulation
   - **Output Generation**: Drafting, revision, formatting for target venue

2. **Task Specificity**: Each phase should have 3-5 specific, actionable tasks with:
   - Clear objectives
   - Dependencies on previous tasks
   - Concrete deliverables
   - Quality checkpoints

3. **Search Strategy**: Include specific, relevant search terms that:
   - Cover the core concepts
   - Include synonyms and related terms
   - Use Boolean operators (AND, OR) effectively
   - Target relevant databases

4. **Quality Assurance**: Build in validation tasks such as:
   - Dual-screener for study selection
   - Quality appraisal tools (CASP, Cochrane ROB, etc.)
   - Cross-validation of findings
   - Reference reconciliation

5. **Estimated Scope**: Suggest realistic paper counts (15-50 based on comprehensiveness)

**RESPONSE FORMAT** (JSON):
{{
    "title": "Comprehensive, academic title for the research",
    "summary": "2-3 sentence executive summary of research approach and key contributions expected",
    "scope": "Detailed description of research scope, inclusion/exclusion criteria, and boundaries",
    "phases": [
        {{
            "name": "Phase Name (e.g., 'Multi-Database Literature Discovery')",
            "description": "What this phase accomplishes and why it matters",
            "tasks": [
                {{
                    "name": "Specific Task Name",
                    "type": "literature_search|pdf_acquisition|reference_extraction|summarization|synthesis|validation|drafting",
                    "description": "Detailed description of what, how, and why",
                    "dependencies": ["Task name this depends on"]
                }}
            ]
        }}
    ],
    "estimated_papers": <realistic number based on scope>,
    "search_terms": ["<concept1>", "<concept2 AND concept3>", "<synonym1 OR synonym2>"],
    "key_themes": ["<theme1>", "<theme2>", "<theme3>"]  // 5-7 expected themes/questions to guide analysis
}}

Remember: Create plans that demonstrate deep understanding of research methodology and would impress experienced researchers."""

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
            logger.warning(f"Could not parse research plan JSON, returning raw response: {response[:200]}...")

        return {"raw_response": response}

    def _get_output_type_guidance(self, output_type: str) -> str:
        """Get specific guidance for different output types."""
        guidance = {
            "literature_review": """
**Literature Review Requirements**:
- Follow PRISMA guidelines for transparency and reproducibility
- Include: PICO framework if applicable, exclusion criteria, quality assessment
- Output: Systematic review with thematic synthesis, gap analysis, future directions
- Structure: Introduction → Methods → Results (by theme) → Discussion → Conclusion
- Target: 4000-8000 words for standard review, up to 15000 for comprehensive
""",
            "research_paper": """
**Research Paper Requirements**:
- Include: Abstract, Introduction, Literature Review, Methods (if applicable), Results, Discussion, Conclusion
- Emphasize: Novel contributions, theoretical framework, practical implications
- Structure: IMRaD or CARS (Creating a Research Space) model
- Target: 6000-10000 words depending on venue
- Include: Figures/tables, limitations, future work
""",
            "research_brief": """
**Research Brief Requirements**:
- Executive summary format for policymakers or practitioners
- Include: Problem statement, key findings, implications, recommendations
- Emphasize: Actionable insights, real-world applications
- Structure: Executive summary → Background → Key Findings → Implications → Recommendations
- Target: 1500-3000 words
- Include: Infographics, callout boxes for key statistics
""",
            "systematic_review": """
**Systematic Review Requirements**:
- Strict adherence to PRISMA-P or Cochrane guidelines
- Pre-register protocol (PROSPERO)
- Include: Registered protocol, comprehensive search strategy, risk of bias assessment
- Emphasize: Reproducibility, minimization of bias, statistical synthesis if possible
- Structure: Protocol → Search strategy → Selection → Quality assessment → Synthesis → Discussion
- Target: 8000-15000 words
- Include: PRISMA flow diagram, risk of bias tables, forest plots (if meta-analysis)
"""
        }
        return guidance.get(output_type, "")


# Singleton instance
llm_service = LLMService()
