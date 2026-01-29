"""Papers Tab - Paper collection browser"""

from textual.containers import Vertical
from textual.widgets import DataTable, Static
from api_client import api_client
from messages import ProjectSelected


class PapersTab(Vertical):
    """Papers tab for browsing collected papers"""

    current_project_id: str = ""

    def compose(self):
        yield Static("Select a project in the Projects tab to view papers", id="papers_prompt")
        yield DataTable(id="papers_table")

    async def on_mount(self) -> None:
        """Initialize the papers table"""
        table = self.query_one(DataTable)
        table.add_column("ID", key="id")
        table.add_column("Title", key="title")
        table.add_column("Authors", key="authors")
        table.add_column("Year", key="year")
        table.add_column("Citations", key="citations")

    def on_project_selected(self, message: ProjectSelected) -> None:
        """Handle project selection"""
        self.current_project_id = message.project_id
        prompt = self.query_one(Static, "#papers_prompt")
        prompt.update(f"Papers for project: {message.project_id[:8]}...")
        self.load_papers()

    async def load_papers(self):
        """Load papers for the selected project"""
        if not self.current_project_id:
            return

        try:
            papers = await api_client.get_project_papers(self.current_project_id)
            table = self.query_one(DataTable)
            table.clear()

            if not papers:
                table.add_row("No papers", "", "", "", "")
                return

            for paper in papers:
                paper_id = paper.get("id", "")[:8]
                title = paper.get("title", "")[:50]
                authors = paper.get("authors", [])
                year = paper.get("year")
                citations = paper.get("citation_count")

                # Format authors
                authors_str = ", ".join(authors[:2]) + ("..." if len(authors) > 2 else "")

                table.add_row(
                    paper_id,
                    title,
                    authors_str if authors_str else "Unknown",
                    str(year) if year else "N/A",
                    str(citations) if citations else "0"
                )
        except Exception as e:
            table = self.query_one(DataTable)
            table.clear()
            table.add_row("Error", str(e), "", "", "")
