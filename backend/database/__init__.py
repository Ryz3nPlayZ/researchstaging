"""Database package initialization."""
from database.connection import get_db, get_db_session, init_db, close_db, engine
from database.models import (
    Base, Project, Plan, Task, TaskDependency, TaskRun,
    Artifact, Paper, Reference, ExecutionLog,
    ProjectStatus, TaskState, TaskType, ArtifactType, OutputType
)
from database.credit_models import (
    User, CreditTransaction, CreditPackage,
    CREDIT_PACKAGES, calculate_credit_cost, get_optimal_provider
)

__all__ = [
    "get_db", "get_db_session", "init_db", "close_db", "engine",
    "Base", "Project", "Plan", "Task", "TaskDependency", "TaskRun",
    "Artifact", "Paper", "Reference", "ExecutionLog",
    "ProjectStatus", "TaskState", "TaskType", "ArtifactType", "OutputType",
    "User", "CreditTransaction", "CreditPackage",
    "CREDIT_PACKAGES", "calculate_credit_cost", "get_optimal_provider"
]
