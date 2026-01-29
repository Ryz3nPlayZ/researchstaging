"""Projects Tab - Project management interface"""

from textual.containers import Horizontal, Vertical
from textual.widgets import DataTable, Static
from textual import on
from api_client import api_client


class ProjectsTab(Vertical):
    """Projects tab with list and details"""

    def compose(self):
        yield DataTable(id="projects_table")

    async def on_mount(self) -> None:
        """Initialize the projects table"""
        table = self.query_one(DataTable)
        table.add_column("ID", key="id")
        table.add_column("Status", key="status")
        table.add_column("Tasks", key="tasks")
        table.add_column("Created", key="created")

        # Load projects
        await self.refresh_projects()

    async def refresh_projects(self):
        """Refresh the projects list"""
        try:
            projects = await api_client.get_projects()
            table = self.query_one(DataTable)
            table.clear()

            for project in projects:
                status = project.get("status", "unknown")
                task_counts = project.get("task_counts", {})
                total = task_counts.get("total", 0)
                completed = task_counts.get("completed", 0)
                created = project.get("created_at", "")

                table.add_row(
                    project.get("id", ""),
                    status,
                    f"{completed}/{total}",
                    created[:19] if created else "",
                    key=project.get("id")
                )
        except Exception as e:
            table = self.query_one(DataTable)
            table.add_row("Error", str(e), "", "")
