"""
Task Executor - Handles async task execution for the research pipeline.
Enhanced with PDF acquisition, reference extraction, and more.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import uuid

from models import (
    Task, TaskStatus, TaskType, Run, Artifact, ArtifactType,
    Event, EventType, Paper
)
from literature_service import literature_service
from llm_service import llm_service
from pdf_service import pdf_service
from reference_service import reference_extractor

logger = logging.getLogger(__name__)


class TaskExecutor:
    """Executes research pipeline tasks asynchronously."""
    
    def __init__(self, db):
        self.db = db
        self.running_tasks: Dict[str, asyncio.Task] = {}
    
    async def execute_task(self, task: Task, project: Dict[str, Any]) -> Optional[str]:
        """Execute a task and return the artifact ID if created."""
        task_id = task.id
        project_id = task.project_id
        
        try:
            # Create run record
            run = Run(task_id=task_id, project_id=project_id)
            run_doc = run.model_dump()
            run_doc["started_at"] = run_doc["started_at"].isoformat()
            await self.db.runs.insert_one(run_doc)
            
            # Update task status to running
            await self._update_task_status(task_id, TaskStatus.RUNNING)
            await self._emit_event(EventType.TASK_STARTED, project_id, task_id, run_id=run.id)
            
            # Execute based on task type
            artifact_id = None
            
            if task.task_type == TaskType.LITERATURE_SEARCH:
                artifact_id = await self._execute_literature_search(task, project, run.id)
            elif task.task_type == TaskType.PDF_ACQUISITION:
                artifact_id = await self._execute_pdf_acquisition(task, project, run.id)
            elif task.task_type == TaskType.REFERENCE_EXTRACTION:
                artifact_id = await self._execute_reference_extraction(task, project, run.id)
            elif task.task_type == TaskType.SUMMARIZATION:
                artifact_id = await self._execute_summarization(task, project, run.id)
            elif task.task_type == TaskType.SYNTHESIS:
                artifact_id = await self._execute_synthesis(task, project, run.id)
            elif task.task_type == TaskType.DRAFTING:
                artifact_id = await self._execute_drafting(task, project, run.id)
            
            # Update task as completed
            await self._update_task_status(
                task_id, 
                TaskStatus.COMPLETED,
                output_artifact_id=artifact_id
            )
            await self._emit_event(EventType.TASK_COMPLETED, project_id, task_id, run_id=run.id, artifact_id=artifact_id)
            
            # Update run as completed
            await self.db.runs.update_one(
                {"id": run.id},
                {"$set": {
                    "status": TaskStatus.COMPLETED.value,
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            return artifact_id
            
        except Exception as e:
            logger.error(f"Task {task_id} failed: {e}")
            await self._update_task_status(task_id, TaskStatus.FAILED, error_message=str(e))
            await self._emit_event(EventType.TASK_FAILED, project_id, task_id, data={"error": str(e)})
            return None
    
    async def _execute_literature_search(
        self, 
        task: Task, 
        project: Dict[str, Any],
        run_id: str
    ) -> str:
        """Execute literature search task."""
        research_goal = project.get("research_goal", "")
        
        # Search literature sources
        papers = await literature_service.search_all(research_goal, limit_per_source=20)
        
        # Store papers in database
        for paper_data in papers:
            paper = Paper(
                project_id=task.project_id,
                **paper_data
            )
            paper_doc = paper.model_dump()
            paper_doc["created_at"] = paper_doc["created_at"].isoformat()
            await self.db.papers.insert_one(paper_doc)
        
        # Create artifact with search results summary
        artifact = Artifact(
            project_id=task.project_id,
            task_id=task.id,
            run_id=run_id,
            artifact_type=ArtifactType.SEARCH_RESULTS,
            title="Literature Search Results",
            content=f"Found {len(papers)} papers from Semantic Scholar and arXiv",
            metadata={
                "paper_count": len(papers),
                "sources": ["semantic_scholar", "arxiv"]
            }
        )
        
        artifact_doc = artifact.model_dump()
        artifact_doc["created_at"] = artifact_doc["created_at"].isoformat()
        await self.db.artifacts.insert_one(artifact_doc)
        
        return artifact.id
    
    async def _execute_pdf_acquisition(
        self,
        task: Task,
        project: Dict[str, Any],
        run_id: str
    ) -> str:
        """Execute PDF acquisition and parsing task."""
        # Get papers with PDF URLs
        papers = await self.db.papers.find(
            {"project_id": task.project_id, "pdf_url": {"$ne": None}},
            {"_id": 0}
        ).to_list(50)
        
        processed_count = 0
        failed_count = 0
        
        for paper in papers:
            pdf_url = paper.get("pdf_url")
            if not pdf_url:
                continue
            
            try:
                result = await pdf_service.process_paper(paper["id"], pdf_url)
                
                if result:
                    # Update paper with full text
                    await self.db.papers.update_one(
                        {"id": paper["id"]},
                        {"$set": {
                            "full_text": result.get("text", "")[:50000],  # Limit size
                            "page_count": result.get("page_count", 0),
                            "pdf_metadata": result.get("metadata", {})
                        }}
                    )
                    processed_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                logger.warning(f"Failed to process PDF for paper {paper['id']}: {e}")
                failed_count += 1
        
        # Create artifact
        artifact = Artifact(
            project_id=task.project_id,
            task_id=task.id,
            run_id=run_id,
            artifact_type=ArtifactType.SEARCH_RESULTS,
            title="PDF Acquisition Results",
            content=f"Processed {processed_count} PDFs, {failed_count} failed",
            metadata={
                "processed_count": processed_count,
                "failed_count": failed_count,
                "total_attempted": len(papers)
            }
        )
        
        artifact_doc = artifact.model_dump()
        artifact_doc["created_at"] = artifact_doc["created_at"].isoformat()
        await self.db.artifacts.insert_one(artifact_doc)
        
        return artifact.id
    
    async def _execute_reference_extraction(
        self,
        task: Task,
        project: Dict[str, Any],
        run_id: str
    ) -> str:
        """Execute reference extraction from papers."""
        # Get papers with full text
        papers = await self.db.papers.find(
            {"project_id": task.project_id, "full_text": {"$exists": True, "$ne": ""}},
            {"_id": 0}
        ).to_list(50)
        
        total_refs = 0
        
        for paper in papers:
            full_text = paper.get("full_text", "")
            if not full_text:
                continue
            
            try:
                references = reference_extractor.extract_references(full_text)
                
                # Store references
                for ref in references:
                    ref_doc = reference_extractor.to_dict(ref)
                    ref_doc["id"] = str(uuid.uuid4())
                    ref_doc["project_id"] = task.project_id
                    ref_doc["paper_id"] = paper["id"]
                    ref_doc["created_at"] = datetime.now(timezone.utc).isoformat()
                    
                    await self.db.references.insert_one(ref_doc)
                    total_refs += 1
                    
            except Exception as e:
                logger.warning(f"Failed to extract references from paper {paper['id']}: {e}")
        
        # Create artifact
        artifact = Artifact(
            project_id=task.project_id,
            task_id=task.id,
            run_id=run_id,
            artifact_type=ArtifactType.REFERENCE_LIST,
            title="Extracted References",
            content=f"Extracted {total_refs} references from {len(papers)} papers",
            metadata={
                "total_references": total_refs,
                "papers_processed": len(papers)
            }
        )
        
        artifact_doc = artifact.model_dump()
        artifact_doc["created_at"] = artifact_doc["created_at"].isoformat()
        await self.db.artifacts.insert_one(artifact_doc)
        
        return artifact.id
    
    async def _execute_summarization(
        self,
        task: Task,
        project: Dict[str, Any],
        run_id: str
    ) -> str:
        """Execute paper summarization task."""
        # Get papers without summaries
        papers = await self.db.papers.find(
            {"project_id": task.project_id, "summary": None},
            {"_id": 0}
        ).to_list(30)
        
        summaries_generated = 0
        for paper in papers:
            # Use full text if available, otherwise abstract
            text_to_summarize = paper.get("full_text") or paper.get("abstract")
            if text_to_summarize:
                try:
                    summary = await llm_service.summarize_paper(
                        paper.get("title", ""),
                        text_to_summarize[:8000]  # Limit context
                    )
                    
                    await self.db.papers.update_one(
                        {"id": paper["id"]},
                        {"$set": {"summary": summary}}
                    )
                    summaries_generated += 1
                except Exception as e:
                    logger.warning(f"Failed to summarize paper {paper.get('id')}: {e}")
        
        # Create artifact
        artifact = Artifact(
            project_id=task.project_id,
            task_id=task.id,
            run_id=run_id,
            artifact_type=ArtifactType.SUMMARY,
            title="Paper Summaries",
            content=f"Generated {summaries_generated} paper summaries",
            metadata={"summaries_generated": summaries_generated}
        )
        
        artifact_doc = artifact.model_dump()
        artifact_doc["created_at"] = artifact_doc["created_at"].isoformat()
        await self.db.artifacts.insert_one(artifact_doc)
        
        return artifact.id
    
    async def _execute_synthesis(
        self,
        task: Task,
        project: Dict[str, Any],
        run_id: str
    ) -> str:
        """Execute literature synthesis task."""
        # Get papers with summaries
        papers = await self.db.papers.find(
            {"project_id": task.project_id},
            {"_id": 0}
        ).to_list(100)
        
        research_goal = project.get("research_goal", "")
        
        # Generate synthesis
        synthesis = await llm_service.synthesize_literature(
            research_goal,
            papers
        )
        
        # Create artifact
        artifact = Artifact(
            project_id=task.project_id,
            task_id=task.id,
            run_id=run_id,
            artifact_type=ArtifactType.DRAFT,
            title="Literature Synthesis",
            content=synthesis,
            metadata={"papers_analyzed": len(papers)}
        )
        
        artifact_doc = artifact.model_dump()
        artifact_doc["created_at"] = artifact_doc["created_at"].isoformat()
        await self.db.artifacts.insert_one(artifact_doc)
        
        return artifact.id
    
    async def _execute_drafting(
        self,
        task: Task,
        project: Dict[str, Any],
        run_id: str
    ) -> str:
        """Execute document drafting task."""
        research_goal = project.get("research_goal", "")
        output_type = project.get("output_type", "literature_review")
        
        # Get synthesis artifact for context
        synthesis_artifact = await self.db.artifacts.find_one(
            {"project_id": task.project_id, "artifact_type": "draft"},
            {"_id": 0}
        )
        
        context = synthesis_artifact.get("content", "") if synthesis_artifact else ""
        
        # Draft the document
        section_type = "Literature Review" if output_type == "literature_review" else "Research Paper"
        draft = await llm_service.draft_section(
            research_goal,
            section_type,
            context
        )
        
        # Create artifact
        artifact = Artifact(
            project_id=task.project_id,
            task_id=task.id,
            run_id=run_id,
            artifact_type=ArtifactType.DRAFT,
            title=f"{section_type} Draft",
            content=draft,
            metadata={"output_type": output_type}
        )
        
        artifact_doc = artifact.model_dump()
        artifact_doc["created_at"] = artifact_doc["created_at"].isoformat()
        await self.db.artifacts.insert_one(artifact_doc)
        
        return artifact.id
    
    async def _update_task_status(
        self,
        task_id: str,
        status: TaskStatus,
        output_artifact_id: Optional[str] = None,
        error_message: Optional[str] = None
    ):
        """Update task status in database."""
        update_data = {
            "status": status.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if status == TaskStatus.RUNNING:
            update_data["started_at"] = datetime.now(timezone.utc).isoformat()
        elif status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        
        if output_artifact_id:
            update_data["output_artifact_id"] = output_artifact_id
        
        if error_message:
            update_data["error_message"] = error_message
        
        await self.db.tasks.update_one(
            {"id": task_id},
            {"$set": update_data}
        )
    
    async def _emit_event(
        self,
        event_type: EventType,
        project_id: str,
        task_id: Optional[str] = None,
        artifact_id: Optional[str] = None,
        run_id: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None
    ):
        """Emit an event to the events collection."""
        event = Event(
            event_type=event_type,
            project_id=project_id,
            task_id=task_id,
            artifact_id=artifact_id,
            run_id=run_id,
            data=data
        )
        
        event_doc = event.model_dump()
        event_doc["timestamp"] = event_doc["timestamp"].isoformat()
        await self.db.events.insert_one(event_doc)
    
    async def update_project_task_counts(self, project_id: str):
        """Update the task counts for a project."""
        pipeline = [
            {"$match": {"project_id": project_id}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        
        cursor = self.db.tasks.aggregate(pipeline)
        counts = {"pending": 0, "running": 0, "completed": 0, "failed": 0}
        
        async for doc in cursor:
            status = doc["_id"]
            if status in counts:
                counts[status] = doc["count"]
        
        await self.db.projects.update_one(
            {"id": project_id},
            {"$set": {"task_counts": counts, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return counts
