"""Papers Tab - Paper collection browser"""

from textual.containers import Vertical
from textual.widgets import DataTable, Static
from api_client import api_client


class PapersTab(Vertical):
    """Papers tab for browsing collected papers"""

    def compose(self):
        yield Static("Select a project to view papers", id="papers_prompt")
        yield DataTable(id="papers_table")

    async def on_mount(self) -> None:
        """Initialize the papers table"""
        table = self.query_one(DataTable)
        table.add_column("ID", key="id")
        table.add_column("Title", key="title")
        table.add_column("Authors", key="authors")
        table.add_column("Year", key="year")
