"""Tasks Tab - Task monitoring interface"""

from textual.containers import Vertical
from textual.widgets import DataTable, Static
from api_client import api_client


class TasksTab(Vertical):
    """Tasks tab for monitoring project tasks"""

    def compose(self):
        yield Static("Select a project to view tasks", id="tasks_prompt")
        yield DataTable(id="tasks_table")

    async def on_mount(self) -> None:
        """Initialize the tasks table"""
        table = self.query_one(DataTable)
        table.add_column("ID", key="id")
        table.add_column("Name", key="name")
        table.add_column("State", key="state")
        table.add_column("Type", key="type")
