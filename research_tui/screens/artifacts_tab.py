"""Artifacts Tab - Artifact browser"""

from textual.containers import Vertical
from textual.widgets import DataTable, Static
from api_client import api_client


class ArtifactsTab(Vertical):
    """Artifacts tab for browsing project artifacts"""

    def compose(self):
        yield Static("Select a project to view artifacts", id="artifacts_prompt")
        yield DataTable(id="artifacts_table")

    async def on_mount(self) -> None:
        """Initialize the artifacts table"""
        table = self.query_one(DataTable)
        table.add_column("ID", key="id")
        table.add_column("Type", key="type")
        table.add_column("Title", key="title")
        table.add_column("Created", key="created")
