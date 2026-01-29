"""Global state management for TUI"""

from typing import Optional
from textual.widgets import DataTable


class TUIState:
    """Global state for the TUI application"""

    def __init__(self):
        self.selected_project_id: Optional[str] = None
        self.projects_table: Optional[DataTable] = None
        self.tasks_table: Optional[DataTable] = None
        self.artifacts_table: Optional[DataTable] = None
        self.papers_table: Optional[DataTable] = None

    def set_selected_project(self, project_id: str):
        """Set the currently selected project"""
        self.selected_project_id = project_id
        # Trigger refresh of other tabs
        self.refresh_all_tabs()

    def refresh_all_tabs(self):
        """Refresh all tabs when project selection changes"""
        if self.tasks_table and self.selected_project_id:
            # This will be called by the Tasks tab
            pass


# Global state instance
tui_state = TUIState()
