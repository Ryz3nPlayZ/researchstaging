"""Artifacts Tab - Artifact browser"""

from textual.containers import Vertical
from textual.widgets import DataTable, Static
from api_client import api_client
from messages import ProjectSelected


class ArtifactsTab(Vertical):
    """Artifacts tab for browsing project artifacts"""

    current_project_id: str = ""

    def compose(self):
        yield Static("Select a project in the Projects tab to view artifacts", id="artifacts_prompt")
        yield DataTable(id="artifacts_table")

    async def on_mount(self) -> None:
        """Initialize the artifacts table"""
        table = self.query_one(DataTable)
        table.add_column("ID", key="id")
        table.add_column("Type", key="type")
        table.add_column("Title", key="title")
        table.add_column("Created", key="created")

    def on_project_selected(self, message: ProjectSelected) -> None:
        """Handle project selection"""
        self.current_project_id = message.project_id
        prompt = self.query_one(Static, "#artifacts_prompt")
        prompt.update(f"Artifacts for project: {message.project_id[:8]}...")
        self.load_artifacts()

    async def load_artifacts(self):
        """Load artifacts for the selected project"""
        if not self.current_project_id:
            return

        try:
            artifacts = await api_client.get_project_artifacts(self.current_project_id)
            table = self.query_one(DataTable)
            table.clear()

            if not artifacts:
                table.add_row("No artifacts", "", "", "")
                return

            for artifact in artifacts:
                artifact_id = artifact.get("id", "")[:8]
                artifact_type = artifact.get("artifact_type", "")
                title = artifact.get("title", "")[:40]
                created = artifact.get("created_at", "")[:19] if artifact.get("created_at") else ""

                # Type icon
                type_icon = {
                    "search_results": "🔍",
                    "pdf_content": "📄",
                    "reference_list": "📚",
                    "summary": "📝",
                    "synthesis": "🔬",
                    "draft": "✍️",
                    "final_output": "✨"
                }.get(artifact_type, "📦")

                table.add_row(
                    artifact_id,
                    f"{type_icon} {artifact_type}",
                    title,
                    created
                )
        except Exception as e:
            table = self.query_one(DataTable)
            table.clear()
            table.add_row("Error", str(e), "", "")
