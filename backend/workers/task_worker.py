"""
Worker Execution Layer for Research Pilot.

Workers are responsible for executing Tasks. They are stateless and may be
terminated at any time without loss of correctness.
"""
import asyncio
import logging
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import json
import redis.asyncio as redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import (
    Task, TaskRun, Artifact, Paper, Reference,
    TaskState, TaskType, ArtifactType, get_db_session
)
from database.models import ExecutionLog
from orchestration import orchestration_engine
from literature_service import literature_service
from llm_service import llm_service
from pdf_service import pdf_service
from reference_service import reference_extractor

logger = logging.getLogger(__name__)


class TaskWorker:
    """
    Stateless worker for executing tasks.
    
    Workers retrieve tasks, execute agents/tools, capture outputs,
    persist artifacts, and update task state atomically.
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis_url = redis_url
        self.redis: Optional[redis.Redis] = None
        self.queue_name = "research_pilot:task_queue"
        self._running = False
    
    async def connect(self):
        """Connect to Redis."""
        self.redis = redis.from_url(self.redis_url, decode_responses=True)
    
    async def disconnect(self):
        """Disconnect from Redis."""
        if self.redis:
            await self.redis.close()
    
    async def enqueue_task(self, task_id: str, project_id: str):
        """Add a task to the execution queue."""
        if not self.redis:
            await self.connect()
        
        task_data = json.dumps({
            "task_id": task_id,
            "project_id": project_id,
            "enqueued_at": datetime.now(timezone.utc).isoformat()
        })
        
        await self.redis.rpush(self.queue_name, task_data)
        logger.info(f"Enqueued task {task_id}")
    
    async def dequeue_task(self, timeout: int = 5) -> Optional[Dict]:
        """Get next task from queue."""
        if not self.redis:
            await self.connect()
        
        result = await self.redis.blpop(self.queue_name, timeout=timeout)
        if result:
            _, task_data = result
            return json.loads(task_data)
        return None
    
    async def execute_task(self, task_id: str) -> Optional[str]:
        """
        Execute a single task and return the artifact ID if created.
        
        Steps:
        1. Retrieve task and input artifacts
        2. Execute the agent/tool
        3. Capture outputs and metadata
        4. Persist output artifact
        5. Update task state atomically
        """
        async with get_db_session() as session:
            try:
                # Get task
                result = await session.execute(
                    select(Task).where(Task.id == task_id)
                )
                task = result.scalar_one_or_none()
                
                if not task:
                    logger.error(f"Task {task_id} not found")
                    return None
                
                # Log start
                await self._log_event(
                    session, task.project_id, task_id, None,
                    "task_started", "info", f"Starting task: {task.name}"
                )
                
                # Create task run
                run = await orchestration_engine.mark_task_running(session, task_id)
                
                start_time = time.time()
                
                # Execute based on task type
                artifact_id = None
                
                if task.task_type == TaskType.LITERATURE_SEARCH:
                    artifact_id = await self._execute_literature_search(session, task, run.id)
                elif task.task_type == TaskType.PDF_ACQUISITION:
                    artifact_id = await self._execute_pdf_acquisition(session, task, run.id)
                elif task.task_type == TaskType.REFERENCE_EXTRACTION:
                    artifact_id = await self._execute_reference_extraction(session, task, run.id)
                elif task.task_type == TaskType.SUMMARIZATION:
                    artifact_id = await self._execute_summarization(session, task, run.id)
                elif task.task_type == TaskType.SYNTHESIS:
                    artifact_id = await self._execute_synthesis(session, task, run.id)
                elif task.task_type == TaskType.DRAFTING:
                    artifact_id = await self._execute_drafting(session, task, run.id)
                
                duration_ms = int((time.time() - start_time) * 1000)
                
                # Complete the run
                await orchestration_engine.complete_task_run(
                    session, run.id,
                    output_artifact_id=artifact_id,
                    duration_ms=duration_ms
                )
                
                # Update project status
                await orchestration_engine.update_project_status(session, task.project_id)
                
                # Log completion
                await self._log_event(
                    session, task.project_id, task_id, run.id,
                    "task_completed", "info", 
                    f"Completed task: {task.name} in {duration_ms}ms"
                )
                
                await session.commit()
                
                # Publish event
                await self._publish_event(task.project_id, "task_completed", {
                    "task_id": task_id,
                    "task_name": task.name,
                    "artifact_id": artifact_id,
                    "duration_ms": duration_ms
                })
                
                return artifact_id
                
            except Exception as e:
                logger.error(f"Task {task_id} failed: {e}")
                
                # Log error
                await self._log_event(
                    session, task.project_id, task_id, None,
                    "task_failed", "error", str(e)
                )
                
                # Fail the run
                await orchestration_engine.fail_task_run(
                    session, run.id if 'run' in locals() else None,
                    error_message=str(e)
                )
                
                await session.commit()
                
                # Publish event
                await self._publish_event(task.project_id, "task_failed", {
                    "task_id": task_id,
                    "error": str(e)
                })
                
                return None
    
    async def _execute_literature_search(
        self, session: AsyncSession, task: Task, run_id: str
    ) -> str:
        """Execute literature search task."""
        # Get project for research goal
        from database import Project
        result = await session.execute(
            select(Project).where(Project.id == task.project_id)
        )
        project = result.scalar_one()
        
        # Search literature sources
        papers = await literature_service.search_all(project.research_goal, limit_per_source=20)
        
        # Store papers
        for paper_data in papers:
            paper = Paper(
                project_id=task.project_id,
                external_id=paper_data.get("external_id"),
                source=paper_data.get("source", "unknown"),
                title=paper_data.get("title", ""),
                authors=paper_data.get("authors", []),
                abstract=paper_data.get("abstract"),
                year=paper_data.get("year"),
                citation_count=paper_data.get("citation_count"),
                url=paper_data.get("url"),
                pdf_url=paper_data.get("pdf_url"),
            )
            session.add(paper)
        
        # Create artifact
        artifact = Artifact(
            project_id=task.project_id,
            task_id=task.id,
            run_id=run_id,
            artifact_type=ArtifactType.SEARCH_RESULTS,
            title="Literature Search Results",
            content=f"Found {len(papers)} papers from Semantic Scholar and arXiv",
            artifact_metadata={"paper_count": len(papers), "sources": ["semantic_scholar", "arxiv"]}
        )
        session.add(artifact)
        await session.flush()
        
        return artifact.id
    
    async def _execute_pdf_acquisition(
        self, session: AsyncSession, task: Task, run_id: str
    ) -> str:
        """Execute PDF acquisition task."""
        result = await session.execute(
            select(Paper).where(
                Paper.project_id == task.project_id,
                Paper.pdf_url.isnot(None)
            )
        )
        papers = list(result.scalars().all())
        
        processed = 0
        failed = 0
        
        for paper in papers[:30]:  # Limit
            try:
                pdf_result = await pdf_service.process_paper(paper.id, paper.pdf_url)
                if pdf_result:
                    paper.full_text = pdf_result.get("text", "")[:50000]
                    paper.page_count = pdf_result.get("page_count", 0)
                    processed += 1
            except Exception as e:
                logger.warning(f"PDF processing failed for {paper.id}: {e}")
                failed += 1
        
        artifact = Artifact(
            project_id=task.project_id,
            task_id=task.id,
            run_id=run_id,
            artifact_type=ArtifactType.PDF_CONTENT,
            title="PDF Acquisition Results",
            content=f"Processed {processed} PDFs, {failed} failed",
            artifact_metadata={"processed": processed, "failed": failed}
        )
        session.add(artifact)
        await session.flush()
        
        return artifact.id
    
    async def _execute_reference_extraction(
        self, session: AsyncSession, task: Task, run_id: str
    ) -> str:
        """Execute reference extraction task."""
        result = await session.execute(
            select(Paper).where(
                Paper.project_id == task.project_id,
                Paper.full_text.isnot(None)
            )
        )
        papers = list(result.scalars().all())
        
        total_refs = 0
        for paper in papers:
            refs = reference_extractor.extract_references(paper.full_text or "")
            for ref in refs:
                ref_doc = Reference(
                    project_id=task.project_id,
                    paper_id=paper.id,
                    raw_text=ref.raw_text,
                    authors=ref.authors,
                    title=ref.title,
                    year=ref.year,
                    journal=ref.journal,
                    doi=ref.doi,
                    arxiv_id=ref.arxiv_id,
                    confidence=ref.confidence
                )
                session.add(ref_doc)
                total_refs += 1
        
        artifact = Artifact(
            project_id=task.project_id,
            task_id=task.id,
            run_id=run_id,
            artifact_type=ArtifactType.REFERENCE_LIST,
            title="Extracted References",
            content=f"Extracted {total_refs} references from {len(papers)} papers",
            artifact_metadata={"total_references": total_refs, "papers_processed": len(papers)}
        )
        session.add(artifact)
        await session.flush()
        
        return artifact.id
    
    async def _execute_summarization(
        self, session: AsyncSession, task: Task, run_id: str
    ) -> str:
        """Execute summarization task."""
        result = await session.execute(
            select(Paper).where(
                Paper.project_id == task.project_id,
                Paper.summary.is_(None)
            )
        )
        papers = list(result.scalars().all())
        
        summarized = 0
        for paper in papers[:20]:
            text = paper.full_text or paper.abstract
            if text:
                try:
                    summary = await llm_service.summarize_paper(
                        paper.title, text[:8000]
                    )
                    paper.summary = summary
                    summarized += 1
                except Exception as e:
                    logger.warning(f"Summarization failed for {paper.id}: {e}")
        
        artifact = Artifact(
            project_id=task.project_id,
            task_id=task.id,
            run_id=run_id,
            artifact_type=ArtifactType.SUMMARY,
            title="Paper Summaries",
            content=f"Generated {summarized} summaries",
            artifact_metadata={"summarized": summarized}
        )
        session.add(artifact)
        await session.flush()
        
        return artifact.id
    
    async def _execute_synthesis(
        self, session: AsyncSession, task: Task, run_id: str
    ) -> str:
        """Execute synthesis task."""
        from database import Project
        
        proj_result = await session.execute(
            select(Project).where(Project.id == task.project_id)
        )
        project = proj_result.scalar_one()
        
        papers_result = await session.execute(
            select(Paper).where(Paper.project_id == task.project_id)
        )
        papers = list(papers_result.scalars().all())
        
        papers_data = [
            {
                "title": p.title,
                "authors": p.authors,
                "year": p.year,
                "summary": p.summary,
                "abstract": p.abstract
            }
            for p in papers
        ]
        
        synthesis = await llm_service.synthesize_literature(
            project.research_goal, papers_data
        )
        
        artifact = Artifact(
            project_id=task.project_id,
            task_id=task.id,
            run_id=run_id,
            artifact_type=ArtifactType.SYNTHESIS,
            title="Literature Synthesis",
            content=synthesis,
            artifact_metadata={"papers_analyzed": len(papers)}
        )
        session.add(artifact)
        await session.flush()
        
        return artifact.id
    
    async def _execute_drafting(
        self, session: AsyncSession, task: Task, run_id: str
    ) -> str:
        """Execute drafting task."""
        from database import Project
        
        proj_result = await session.execute(
            select(Project).where(Project.id == task.project_id)
        )
        project = proj_result.scalar_one()
        
        # Get synthesis artifact
        synth_result = await session.execute(
            select(Artifact).where(
                Artifact.project_id == task.project_id,
                Artifact.artifact_type == ArtifactType.SYNTHESIS
            ).order_by(Artifact.created_at.desc())
        )
        synthesis_artifact = synth_result.scalar_one_or_none()
        
        context = synthesis_artifact.content if synthesis_artifact else ""
        
        section_type = "Literature Review" if project.output_type.value == "literature_review" else "Research Paper"
        
        draft = await llm_service.draft_section(
            project.research_goal, section_type, context
        )
        
        artifact = Artifact(
            project_id=task.project_id,
            task_id=task.id,
            run_id=run_id,
            artifact_type=ArtifactType.DRAFT,
            title=f"{section_type} Draft",
            content=draft,
            artifact_metadata={"output_type": project.output_type.value}
        )
        session.add(artifact)
        await session.flush()
        
        return artifact.id
    
    async def _log_event(
        self, session: AsyncSession,
        project_id: str, task_id: Optional[str], run_id: Optional[str],
        event_type: str, level: str, message: str,
        data: Optional[Dict] = None
    ):
        """Log an execution event."""
        log = ExecutionLog(
            project_id=project_id,
            task_id=task_id,
            run_id=run_id,
            event_type=event_type,
            level=level,
            message=message,
            data=data
        )
        session.add(log)
    
    async def _publish_event(self, project_id: str, event_type: str, data: Dict):
        """Publish event to Redis pub/sub for WebSocket broadcast."""
        if not self.redis:
            await self.connect()
        
        event = {
            "type": event_type,
            "project_id": project_id,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.redis.publish(f"project:{project_id}", json.dumps(event))
    
    async def run_worker_loop(self):
        """
        Main worker loop.
        Continuously dequeues and executes tasks.
        """
        logger.info("Starting worker loop")
        self._running = True
        await self.connect()
        
        while self._running:
            try:
                task_data = await self.dequeue_task(timeout=5)
                
                if task_data:
                    task_id = task_data["task_id"]
                    logger.info(f"Processing task {task_id}")
                    await self.execute_task(task_id)
                    
            except Exception as e:
                logger.error(f"Worker error: {e}")
                await asyncio.sleep(1)
        
        await self.disconnect()
    
    def stop(self):
        """Stop the worker loop."""
        self._running = False


# Singleton instance
task_worker = TaskWorker()
