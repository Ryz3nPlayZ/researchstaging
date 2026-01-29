"""Monitor Tab - Real-time task execution monitoring"""

from textual.containers import Vertical
from textual.widgets import DataTable, Static, Footer
from api_client import api_client


class MonitorTab(Vertical):
    """Monitor tab for real-time task execution"""

    def compose(self):
        yield Static("Live Task Execution Monitor", id="monitor_header")
        yield DataTable(id="monitor_table")
        yield Static("Press 'r' to refresh | Auto-refresh every 5 seconds", id="monitor_footer")

    async def on_mount(self) -> None:
        """Initialize the monitor"""
        table = self.query_one(DataTable)
        table.add_column("Project", key="project")
        table.add_column("Task", key="task")
        table.add_column("Status", key="status")
        table.add_column("Progress", key="progress")

        # Start auto-refresh
        self.set_interval(5.0, self.refresh_monitor)

    async def refresh_monitor(self):
        """Refresh the monitor with current running tasks"""
        try:
            projects = await api_client.get_projects()
            table = self.query_one(DataTable)
            table.clear()

            for project in projects:
                if project.get("status") in ["executing", "running"]:
                    tasks = await api_client.get_project_tasks(project.get("id", ""))
                    for task in tasks:
                        if task.get("state") in ["running", "waiting"]:
                            table.add_row(
                                project.get("id", "")[:8],
                                task.get("name", "")[:30],
                                task.get("state", ""),
                                "⚡ Running"
                            )
        except Exception as e:
            pass  # Silently handle refresh errors
