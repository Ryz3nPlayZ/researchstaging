"""Custom messages for TUI communication"""

from textual.messages import Message


class ProjectSelected(Message):
    """Message sent when a project is selected"""

    def __init__(self, project_id: str) -> None:
        self.project_id = project_id
        super().__init__()
