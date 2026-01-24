#!/usr/bin/env python3
"""
Script to add dependencies to an existing project that has tasks but no dependencies.
This creates sequential and phase-based dependencies for tasks.
"""
import asyncio
import sys
sys.path.insert(0, '/home/zemul/Programming/research/backend')

from database import get_db_session, Task, TaskDependency
from sqlalchemy import select, delete


async def add_dependencies_to_project(project_id: str):
    """Add dependencies to all tasks in a project."""
    async with get_db_session() as session:
        # Get all tasks ordered by phase and sequence
        result = await session.execute(
            select(Task)
            .where(Task.project_id == project_id)
            .order_by(Task.phase_index, Task.sequence_index)
        )
        tasks = list(result.scalars().all())

        if not tasks:
            print(f"No tasks found for project {project_id}")
            return

        print(f"Found {len(tasks)} tasks")

        # Delete existing dependencies for this project
        await session.execute(
            delete(TaskDependency).where(
                TaskDependency.dependent_task_id.in_([t.id for t in tasks])
            )
        )
        await session.flush()
        print("Cleared existing dependencies")

        # Group tasks by phase
        phase_tasks = {}
        for task in tasks:
            if task.phase_index not in phase_tasks:
                phase_tasks[task.phase_index] = []
            phase_tasks[task.phase_index].append(task)

        # Create dependencies
        dependencies_created = 0

        # Within each phase, create sequential dependencies
        for phase_index, tasks_in_phase in sorted(phase_tasks.items()):
            print(f"\nPhase {phase_index}: {len(tasks_in_phase)} tasks")

            for i, task in enumerate(tasks_in_phase):
                # Skip first task in phase - no dependency needed
                if i > 0:
                    prev_task = tasks_in_phase[i - 1]
                    dep = TaskDependency(
                        dependent_task_id=task.id,
                        dependency_task_id=prev_task.id
                    )
                    session.add(dep)
                    dependencies_created += 1
                    print(f"  {task.name} -> {prev_task.name}")

        # Create dependencies between phases
        # Each task in phase N depends on the last task of phase N-1
        for i in range(1, max(phase_tasks.keys()) + 1):
            if i - 1 in phase_tasks and phase_tasks[i - 1]:
                prev_phase_last_task = phase_tasks[i - 1][-1]
                if i in phase_tasks:
                    for task in phase_tasks[i]:
                        dep = TaskDependency(
                            dependent_task_id=task.id,
                            dependency_task_id=prev_phase_last_task.id
                        )
                        session.add(dep)
                        dependencies_created += 1
                        print(f"  [PHASE] {task.name} -> {prev_phase_last_task.name}")

        await session.commit()
        print(f"\nCreated {dependencies_created} dependencies")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        project_id = sys.argv[1]
    else:
        # Use the project we found earlier
        project_id = "193f6c4b-2ba0-48f6-9ba0-c1111d323a04"

    asyncio.run(add_dependencies_to_project(project_id))
    print("Done!")
