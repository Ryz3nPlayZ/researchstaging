"""
Orchestration Engine for Research Pilot.

Responsible for:
- Converting Plans into executable Task DAGs
- Managing task state transitions
- Scheduling ready tasks for execution
- Handling dependency resolution
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional, Set
from datetime import datetime, timezone
from sqlalchemy import select, update, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.models import (
    Project, Plan, Task, TaskDependency, TaskRun, Artifact,
    ProjectStatus, TaskState, TaskType, ArtifactType
)

logger = logging.getLogger(__name__)


class OrchestrationEngine:
    """
    State-driven orchestration engine.
    
    Manages task lifecycle and dependency resolution.
    Does not execute tasks directly - only manages state and scheduling decisions.
    """
    
    def __init__(self, redis_client=None):
        self.redis = redis_client
        self._running = False
    
    async def expand_plan_to_tasks(
        self,
        session: AsyncSession,
        project_id: str,
        plan: Plan
    ) -> List[Task]:
        """
        Expand a Plan into a directed acyclic graph of Tasks.

        This creates Task records and dependency relationships in the database.
        Cycles are explicitly disallowed.
        """
        task_name_to_id: Dict[str, str] = {}
        all_tasks: List[Task] = []
        phase_tasks: List[Task] = []  # Track tasks per phase for auto-dependencies

        phase_index = 0
        for phase in plan.phases or []:
            current_phase_tasks = []
            sequence_index = 0
            for task_def in phase.get("tasks", []):
                # Map task type
                task_type = self._map_task_type(task_def.get("type", ""))

                # Create task
                task = Task(
                    project_id=project_id,
                    name=task_def.get("name", f"Task {len(all_tasks) + 1}"),
                    description=task_def.get("description", ""),
                    task_type=task_type,
                    phase_index=phase_index,
                    sequence_index=sequence_index,
                    state=TaskState.PENDING,
                    agent_config=task_def.get("agent_config"),
                )

                session.add(task)
                await session.flush()  # Get the ID

                task_name_to_id[task.name] = task.id
                current_phase_tasks.append(task)
                all_tasks.append((task, task_def.get("dependencies", [])))
                sequence_index += 1

            phase_tasks.append(current_phase_tasks)
            phase_index += 1

        # Create dependency relationships
        dependencies_created = 0
        created_dependencies = set()  # Track (dependent_id, dependency_id) pairs to avoid duplicates

        for task, dep_names in all_tasks:
            # Track if this task has any explicit dependencies
            has_explicit_deps = False

            # First try to create explicit dependencies from the plan
            for dep_name in dep_names:
                # Try exact match first
                if dep_name in task_name_to_id:
                    dep_key = (str(task.id), str(task_name_to_id[dep_name]))
                    if dep_key not in created_dependencies:
                        dep = TaskDependency(
                            dependent_task_id=task.id,
                            dependency_task_id=task_name_to_id[dep_name]
                        )
                        session.add(dep)
                        created_dependencies.add(dep_key)
                        dependencies_created += 1
                        has_explicit_deps = True
                        logger.info(f"Created dependency: {task.name} -> {dep_name}")
                else:
                    # Try fuzzy matching - find task name that contains the dep_name
                    for task_name, task_id in task_name_to_id.items():
                        if dep_name.lower() in task_name.lower() or task_name.lower() in dep_name.lower():
                            dep_key = (str(task.id), str(task_id))
                            if dep_key not in created_dependencies:
                                dep = TaskDependency(
                                    dependent_task_id=task.id,
                                    dependency_task_id=task_id
                                )
                                session.add(dep)
                                created_dependencies.add(dep_key)
                                dependencies_created += 1
                                has_explicit_deps = True
                                logger.info(f"Created fuzzy dependency: {task.name} -> {task_name} (matched: {dep_name})")
                            break

            # If no explicit dependencies and this isn't the first task in its phase,
            # create a dependency on the previous task in the same phase
            if not has_explicit_deps and task.sequence_index > 0:
                # Find the task in the same phase with sequence_index - 1
                for other_task, _ in all_tasks:
                    if (other_task.phase_index == task.phase_index and
                        other_task.sequence_index == task.sequence_index - 1):
                        dep_key = (str(task.id), str(other_task.id))
                        if dep_key not in created_dependencies:
                            dep = TaskDependency(
                                dependent_task_id=task.id,
                                dependency_task_id=other_task.id
                            )
                            session.add(dep)
                            created_dependencies.add(dep_key)
                            dependencies_created += 1
                            logger.info(f"Created sequential dependency: {task.name} -> {other_task.name}")
                        break

        # Also create dependencies between phases - each task in phase N depends on
        # the last task of phase N-1
        for i in range(1, len(phase_tasks)):
            prev_phase_last_task = phase_tasks[i-1][-1] if phase_tasks[i-1] else None
            if prev_phase_last_task:
                for task in phase_tasks[i]:
                    dep_key = (str(task.id), str(prev_phase_last_task.id))
                    if dep_key not in created_dependencies:
                        dep = TaskDependency(
                            dependent_task_id=task.id,
                            dependency_task_id=prev_phase_last_task.id
                        )
                        session.add(dep)
                        created_dependencies.add(dep_key)
                        dependencies_created += 1
                        logger.info(f"Created phase dependency: {task.name} -> {prev_phase_last_task.name}")

        logger.info(f"Total dependencies created: {dependencies_created}")
        await session.flush()
        
        # Validate DAG (no cycles)
        await self._validate_dag(session, project_id)
        
        # Update tasks with no dependencies to READY state
        await self._update_ready_tasks(session, project_id)
        
        # Update project task counts
        await self._update_project_task_counts(session, project_id)
        
        return [t for t, _ in all_tasks]
    
    def _map_task_type(self, type_str: str) -> TaskType:
        """Map string task type to enum."""
        mapping = {
            "literature_search": TaskType.LITERATURE_SEARCH,
            "pdf_acquisition": TaskType.PDF_ACQUISITION,
            "reference_extraction": TaskType.REFERENCE_EXTRACTION,
            "summarization": TaskType.SUMMARIZATION,
            "synthesis": TaskType.SYNTHESIS,
            "drafting": TaskType.DRAFTING,
            "aggregation": TaskType.AGGREGATION,
            "validation": TaskType.VALIDATION,
        }
        return mapping.get(type_str, TaskType.LITERATURE_SEARCH)
    
    async def _validate_dag(self, session: AsyncSession, project_id: str):
        """
        Validate that the task graph is acyclic.
        Raises ValueError if a cycle is detected.
        """
        # Get all tasks and dependencies
        result = await session.execute(
            select(Task).where(Task.project_id == project_id)
        )
        tasks = {t.id: t for t in result.scalars().all()}
        
        result = await session.execute(
            select(TaskDependency).where(
                TaskDependency.dependent_task_id.in_(tasks.keys())
            )
        )
        deps = result.scalars().all()
        
        # Build adjacency list
        graph: Dict[str, Set[str]] = {tid: set() for tid in tasks}
        for dep in deps:
            graph[dep.dependent_task_id].add(dep.dependency_task_id)
        
        # Topological sort to detect cycles
        visited = set()
        rec_stack = set()
        
        def has_cycle(node: str) -> bool:
            visited.add(node)
            rec_stack.add(node)
            
            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    if has_cycle(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            
            rec_stack.remove(node)
            return False
        
        for task_id in tasks:
            if task_id not in visited:
                if has_cycle(task_id):
                    raise ValueError(f"Cycle detected in task graph for project {project_id}")
    
    async def _update_ready_tasks(self, session: AsyncSession, project_id: str):
        """
        Update PENDING tasks to READY if all dependencies are satisfied.
        Uses individual task updates to avoid deadlocks.
        """
        # Get pending tasks for this project
        pending_result = await session.execute(
            select(Task.id).where(
                and_(
                    Task.project_id == project_id,
                    Task.state == TaskState.PENDING
                )
            )
        )
        pending_task_ids = [row[0] for row in pending_result.all()]
        
        if not pending_task_ids:
            return
        
        # For each pending task, check if all dependencies are completed
        for task_id in pending_task_ids:
            # Count incomplete dependencies
            dep_result = await session.execute(
                select(func.count(TaskDependency.id))
                .join(Task, Task.id == TaskDependency.dependency_task_id)
                .where(
                    and_(
                        TaskDependency.dependent_task_id == task_id,
                        Task.state != TaskState.COMPLETED
                    )
                )
            )
            incomplete_deps = dep_result.scalar() or 0
            
            # If no incomplete dependencies, mark as ready
            if incomplete_deps == 0:
                await session.execute(
                    update(Task)
                    .where(
                        and_(
                            Task.id == task_id,
                            Task.state == TaskState.PENDING  # Double-check state
                        )
                    )
                    .values(state=TaskState.READY, updated_at=datetime.now(timezone.utc))
                )
    
    async def _update_project_task_counts(self, session: AsyncSession, project_id: str):
        """Update aggregated task counts on the project."""
        result = await session.execute(
            select(Task.state, func.count(Task.id))
            .where(Task.project_id == project_id)
            .group_by(Task.state)
        )
        
        counts = {
            "pending": 0, "ready": 0, "running": 0,
            "waiting": 0, "completed": 0, "failed": 0, "cancelled": 0
        }
        
        for state, count in result.all():
            counts[state.value] = count
        
        await session.execute(
            update(Project)
            .where(Project.id == project_id)
            .values(task_counts=counts, updated_at=datetime.now(timezone.utc))
        )
        
        return counts
    
    async def get_ready_tasks(
        self, 
        session: AsyncSession, 
        project_id: Optional[str] = None,
        limit: int = 10
    ) -> List[Task]:
        """
        Get tasks that are ready to be executed.
        """
        query = select(Task).where(Task.state == TaskState.READY)
        
        if project_id:
            query = query.where(Task.project_id == project_id)
        
        query = query.order_by(Task.phase_index, Task.sequence_index).limit(limit)
        
        result = await session.execute(query)
        return list(result.scalars().all())
    
    async def transition_task_state(
        self,
        session: AsyncSession,
        task_id: str,
        new_state: TaskState,
        error_message: Optional[str] = None,
        output_artifact_id: Optional[str] = None
    ) -> Task:
        """
        Atomically transition a task to a new state.
        All state transitions are persisted in the database.
        """
        result = await session.execute(
            select(Task).where(Task.id == task_id).with_for_update()
        )
        task = result.scalar_one_or_none()
        
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        # Validate state transition
        valid_transitions = {
            TaskState.PENDING: [TaskState.READY, TaskState.CANCELLED],
            TaskState.READY: [TaskState.RUNNING, TaskState.CANCELLED],
            TaskState.RUNNING: [TaskState.COMPLETED, TaskState.FAILED, TaskState.WAITING, TaskState.CANCELLED],
            TaskState.WAITING: [TaskState.RUNNING, TaskState.CANCELLED],
            TaskState.COMPLETED: [],  # Terminal state
            TaskState.FAILED: [TaskState.READY],  # Can retry
            TaskState.CANCELLED: [],  # Terminal state
        }
        
        if new_state not in valid_transitions.get(task.state, []):
            raise ValueError(f"Invalid state transition: {task.state} -> {new_state}")
        
        # Update task
        task.state = new_state
        task.updated_at = datetime.now(timezone.utc)
        
        if new_state == TaskState.RUNNING:
            task.started_at = datetime.now(timezone.utc)
        elif new_state in [TaskState.COMPLETED, TaskState.FAILED]:
            task.completed_at = datetime.now(timezone.utc)
        
        if error_message:
            task.error_message = error_message
        
        if output_artifact_id:
            task.output_artifact_id = output_artifact_id
        
        await session.flush()
        
        # If completed, update downstream tasks
        if new_state == TaskState.COMPLETED:
            await self._update_ready_tasks(session, task.project_id)
        
        # Update project task counts
        await self._update_project_task_counts(session, task.project_id)
        
        return task
    
    async def mark_task_running(self, session: AsyncSession, task_id: str) -> TaskRun:
        """
        Mark a task as running and create a new TaskRun record.
        """
        result = await session.execute(
            select(Task).where(Task.id == task_id)
        )
        task = result.scalar_one_or_none()
        
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        # Get current run count
        run_count_result = await session.execute(
            select(func.count(TaskRun.id)).where(TaskRun.task_id == task_id)
        )
        run_count = run_count_result.scalar() or 0
        
        # Create new run
        run = TaskRun(
            task_id=task_id,
            run_number=run_count + 1,
            state=TaskState.RUNNING,
        )
        session.add(run)
        
        # Transition task state
        await self.transition_task_state(session, task_id, TaskState.RUNNING)
        
        await session.flush()
        return run
    
    async def complete_task_run(
        self,
        session: AsyncSession,
        run_id: str,
        output_artifact_id: Optional[str] = None,
        duration_ms: Optional[int] = None,
        tokens_used: Optional[int] = None
    ):
        """
        Mark a task run as completed.
        """
        result = await session.execute(
            select(TaskRun).where(TaskRun.id == run_id)
        )
        run = result.scalar_one_or_none()
        
        if not run:
            raise ValueError(f"TaskRun {run_id} not found")
        
        run.state = TaskState.COMPLETED
        run.completed_at = datetime.now(timezone.utc)
        run.output_artifact_id = output_artifact_id
        run.duration_ms = duration_ms
        run.tokens_used = tokens_used
        
        # Update parent task
        await self.transition_task_state(
            session, 
            run.task_id, 
            TaskState.COMPLETED,
            output_artifact_id=output_artifact_id
        )
    
    async def fail_task_run(
        self,
        session: AsyncSession,
        run_id: str,
        error_message: str,
        error_details: Optional[Dict] = None
    ):
        """
        Mark a task run as failed.
        """
        result = await session.execute(
            select(TaskRun).where(TaskRun.id == run_id)
        )
        run = result.scalar_one_or_none()
        
        if not run:
            raise ValueError(f"TaskRun {run_id} not found")
        
        run.state = TaskState.FAILED
        run.completed_at = datetime.now(timezone.utc)
        run.error_message = error_message
        run.error_details = error_details
        
        # Check if we should retry
        task_result = await session.execute(
            select(Task).where(Task.id == run.task_id)
        )
        task = task_result.scalar_one()
        
        if task.retry_count < task.max_retries:
            task.retry_count += 1
            # Keep task in READY state for retry
            task.state = TaskState.READY
        else:
            # Update parent task to failed
            await self.transition_task_state(
                session,
                run.task_id,
                TaskState.FAILED,
                error_message=error_message
            )
    
    async def get_task_dag(
        self, 
        session: AsyncSession, 
        project_id: str
    ) -> Dict[str, Any]:
        """
        Get the task DAG for visualization.
        Returns nodes and edges suitable for React Flow.
        """
        # Get all tasks
        result = await session.execute(
            select(Task)
            .where(Task.project_id == project_id)
            .order_by(Task.phase_index, Task.sequence_index)
        )
        tasks = list(result.scalars().all())
        
        # Get all dependencies
        task_ids = [t.id for t in tasks]
        dep_result = await session.execute(
            select(TaskDependency).where(
                TaskDependency.dependent_task_id.in_(task_ids)
            )
        )
        dependencies = list(dep_result.scalars().all())
        
        # Build nodes with improved hierarchical layout
        nodes = []
        task_positions = {}

        # Group tasks by phase for better layout
        phase_tasks = {}
        for task in tasks:
            if task.phase_index not in phase_tasks:
                phase_tasks[task.phase_index] = []
            phase_tasks[task.phase_index].append(task)

        # Calculate positions using hierarchical layout
        x_offset = 50
        y_offset = 100
        x_spacing = 350  # Horizontal spacing between phases
        y_spacing = 150  # Vertical spacing between tasks

        for phase_idx in sorted(phase_tasks.keys()):
            phase_task_list = phase_tasks[phase_idx]
            # Sort tasks by sequence_index within phase
            phase_task_list.sort(key=lambda t: t.sequence_index)

            # Center the phase's tasks vertically
            phase_height = len(phase_task_list) * y_spacing
            start_y = y_offset + (600 - phase_height) / 2  # Center in 600px height

            for seq_idx, task in enumerate(phase_task_list):
                x_pos = x_offset + (task.phase_index * x_spacing)
                y_pos = start_y + (seq_idx * y_spacing)

                task_positions[task.id] = {"x": x_pos, "y": y_pos}

                nodes.append({
                    "id": task.id,
                    "type": "taskNode",
                    "position": {"x": x_pos, "y": y_pos},
                    "data": {
                        "label": task.name,
                        "status": task.state.value,
                        "type": task.task_type.value,
                        "description": task.description or "",
                        "phase": task.phase_index,
                    }
                })
        
        # Build edges with better styling
        edges = []
        for dep in dependencies:
            # Determine edge style based on task states
            source_task = next((t for t in tasks if t.id == dep.dependency_task_id), None)
            target_task = next((t for t in tasks if t.id == dep.dependent_task_id), None)

            # Animate edge if source is running or completed and target is ready/running
            animated = (
                source_task and target_task and
                (source_task.state.value in ['running', 'completed'] and
                 target_task.state.value in ['ready', 'running'])
            )

            # Color based on target status
            if target_task and target_task.state.value == 'completed':
                stroke_color = "#22c55e"  # green
            elif target_task and target_task.state.value == 'failed':
                stroke_color = "#ef4444"  # red
            elif target_task and target_task.state.value == 'running':
                stroke_color = "#3b82f6"  # blue
            else:
                stroke_color = "#64748b"  # slate

            edges.append({
                "id": f"{dep.dependency_task_id}-{dep.dependent_task_id}",
                "source": dep.dependency_task_id,
                "target": dep.dependent_task_id,
                "animated": animated,
                "style": {
                    "stroke": stroke_color,
                    "strokeWidth": 2,
                    "strokeLinecap": "round"
                },
                "type": "smoothstep"
            })
        
        return {"nodes": nodes, "edges": edges}
    
    async def update_project_status(self, session: AsyncSession, project_id: str):
        """
        Derive project status from aggregate task states.
        """
        counts = await self._update_project_task_counts(session, project_id)
        
        result = await session.execute(
            select(Project).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()
        
        if not project:
            return
        
        total_tasks = sum(counts.values())
        
        if counts["failed"] > 0:
            new_status = ProjectStatus.FAILED
        elif counts["running"] > 0:
            new_status = ProjectStatus.EXECUTING
        elif counts["completed"] == total_tasks and total_tasks > 0:
            new_status = ProjectStatus.COMPLETED
            project.completed_at = datetime.now(timezone.utc)
        elif counts["ready"] > 0 or counts["pending"] > 0:
            new_status = ProjectStatus.EXECUTING
        else:
            new_status = project.status
        
        if project.status != new_status:
            project.status = new_status
            project.updated_at = datetime.now(timezone.utc)


# Singleton instance
orchestration_engine = OrchestrationEngine()
