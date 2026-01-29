"""Research Pilot TUI - Main Application"""

from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, TabbedContent, TabPane
from textual.containers import Container
from screens.projects_tab import ProjectsTab
from screens.tasks_tab import TasksTab
from screens.artifacts_tab import ArtifactsTab
from screens.papers_tab import PapersTab
from screens.chat_tab import ChatTab
from screens.monitor_tab import MonitorTab


class ResearchTUI(App):
    """Research Pilot Terminal UI"""

    CSS = """
    Screen {
        background: $background;
    }

    #tab-container {
        height: 1fr;
    }

    ProjectsTab, TasksTab, ArtifactsTab, PapersTab, ChatTab, MonitorTab {
        padding: 1;
    }
    """

    TITLE = "Research Pilot"
    SUB_TITLE = "AI-Native Research Execution System"
    BINDINGS = [
        ("q", "quit", "Quit"),
        ("?", "app.show_help", "Help"),
    ]

    def compose(self) -> ComposeResult:
        """Compose the UI"""
        yield Header()
        with Container():
            with TabbedContent(id="tab-container"):
                yield TabPane("Projects", ProjectsTab(), id="projects")
                yield TabPane("Tasks", TasksTab(), id="tasks")
                yield TabPane("Artifacts", ArtifactsTab(), id="artifacts")
                yield TabPane("Papers", PapersTab(), id="papers")
                yield TabPane("Chat", ChatTab(), id="chat")
                yield TabPane("Monitor", MonitorTab(), id="monitor")
        yield Footer()


def run():
    """Run the TUI application"""
    app = ResearchTUI()
    app.run()


if __name__ == "__main__":
    run()
