# Research Pilot TUI

Terminal User Interface for the Research Pilot AI-Native Research Execution System.

## Features

- **Projects Tab**: View and manage research projects
- **Tasks Tab**: Monitor task execution with status tracking
- **Artifacts Tab**: Browse and view research artifacts
- **Papers Tab**: Access collected papers and citations
- **Chat Tab**: Interactive AI chat interface
- **Monitor Tab**: Real-time task execution monitoring

## Installation

```bash
cd research_tui
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

### Start the TUI

```bash
./venv/bin/python run.py
```

Or install globally:

```bash
pip install -e .
research
```

### Keyboard Controls

- `Tab` - Switch between tabs
- `Arrow Keys` - Navigate lists
- `Enter` - View details/select item
- `Esc` - Go back
- `q` - Quit
- `?` - Help

### Backend Connection

The TUI connects to `http://localhost:8000` by default. Ensure the backend is running:

```bash
cd backend
python server.py
```

## Requirements

- Python 3.10+
- Backend server running on port 8000
- Virtual environment (recommended)

## Dependencies

- textual>=0.83.0 - Terminal UI framework
- httpx>=0.27.0 - Async HTTP client
- websockets>=13.0 - WebSocket support for live updates
