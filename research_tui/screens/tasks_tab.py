"""Tasks Tab - Task monitoring interface"""

from textual.containers import Vertical
from textual.widgets import DataTable, Static
from textual import on
from api_client import api_client
from messages import ProjectSelected


class TasksTab(Vertical):
    """Tasks tab for monitoring project tasks"""

    current_project_id: str = ""

    def compose(self):
        yield Static("Select a project in the Projects tab to view tasks", id="tasks_prompt")
        yield DataTable(id="tasks_table")

    async def on_mount(self) -> None:
        """Initialize the tasks table"""
        table = self.query_one(DataTable)
        table.add_column("ID", key="id")
        table.add_column("Name", key="name")
        table.add_column("Phase", key="phase")
        table.add_column("State", key="state")
        table.add_column("Type", key="type")

    def on_project_selected(self, message: ProjectSelected) -> None:
        """Handle project selection"""
        self.current_project_id = message.project_id
        # Update prompt and load tasks
        prompt = self.query_one(Static, "#tasks_prompt")
        prompt.update(f"Tasks for project: {message.project_id[:8]}...")
        self.load_tasks()

    async def load_tasks(self):
        """Load tasks for the selected project"""
        if not self.current_project_id:
            return

        try:
            tasks = await api_client.get_project_tasks(self.current_project_id)
            table = self.query_one(DataTable)
            table.clear()

            if not tasks:
                table.add_row("No tasks", "", "", "", "")
                return

            for task in tasks:
                # Format task ID to be shorter
                task_id = task.get("id", "")[:8]
                name = task.get("name", "")[:40]
                phase = f"P{task.get('phase_index', 0)}"
                state = task.get("state", "")
                task_type = task.get("task_type", "")

                # Add status icon
                state_icon = {
                    "pending": "⏳",
                    "ready": "▶️",
                    "running": "⚡",
                    "waiting": "⏸️",
                    "completed": "✅",
                    "failed": "❌",
                    "cancelled": "🚫"
                }.get(state, "❓")

                table.add_row(
                    task_id,
                    name,
                    phase,
                    f"{state_icon} {state}",
                    task_type
                )
        except Exception as e:
            table = self.query_one(DataTable)
            table.clear()
            table.add_row("Error", str(e), "", "", "")
