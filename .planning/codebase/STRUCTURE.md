# Codebase Structure

**Analysis Date:** 2026-02-11

## Directory Layout

```
/home/zemul/Programming/research/
├── backend/                    # Python/FastAPI backend
│   ├── database/              # Data models and connection
│   ├── orchestration/         # Task orchestration (unused)
│   ├── workers/              # Task workers
│   ├── realtime/             # WebSocket handlers
│   └── *.py                  # Service files and API endpoints
├── frontend/                  # React frontend (primary)
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── context/          # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   └── lib/              # Utilities and API clients
│   └── package.json         # Dependencies
├── frontend3/                # Alternative frontend (incomplete)
│   └── vite.config.ts        # Build config only
├── research_tui/              # Terminal UI (separate package)
│   ├── main.py               # Textual app entry point
│   └── state.py              # TUI state management
└── .planning/                # Project documentation
```

## Directory Purposes

### Backend ( /home/zemul/Programming/research/backend/ )
- **Purpose**: API server and business logic
- **Contains**:
  - Service classes (15+ files)
  - API endpoints (20+ routes)
  - Database models
  - Orchestration engine (unused)
- **Key files**:
  - `server.py`: Main application entry point (1000+ lines)
  - `models.py`: Database schema
  - `orchestration/engine.py`: Unused state management

### Frontend ( /home/zemul/Programming/research/frontend/ )
- **Purpose**: Primary React web interface
- **Contains**: Main application UI components
- **Key files**:
  - `src/index.js`: Application entry point
  - `src/App.js`: Root component
  - `src/lib/api.js`: WebSocket and HTTP clients
  - `src/context/ProjectContext.js`: Global state

### Frontend3 ( /home/zemul/Programming/research/frontend3/ )
- **Purpose**: Alternative frontend implementation
- **Status**: Incomplete - only build configuration
- **Issue**: Parallel implementation creates confusion

### Research TUI ( /home/zemul/Programming/research/research_tui/ )
- **Purpose**: Terminal-based interface
- **Status**: Separate Python package
- **Issue**: Third interface dilutes development focus

### Database Layer ( /home/zemul/Programming/research/backend/database/ )
- **Purpose**: Data models and connection management
- **Contains**:
  - `models.py`: Core SQLAlchemy models
  - `connection.py`: Database utilities
  - Specialized model files for features
- **Key files**:
  - `models.py`: Main data schema
  - `connection.py`: Database connection setup

## Key File Locations

### Entry Points
- **Backend**: `/home/zemul/Programming/research/backend/server.py`
- **Frontend**: `/home/zemul/Programming/research/frontend/src/index.js`
- **TUI**: `/home/zemul/Programming/research/research_tui/main.py`

### Configuration
- **Backend**: `/home/zemul/Programming/research/backend/.env`
- **Frontend**: `/home/zemul/Programming/research/frontend/package.json`
- **Build**: `/home/zemul/Programming/research/frontend/vite.config.js` (missing)

### Core Logic
- **Services**: `/home/zemul/Programming/research/backend/*_service.py`
- **API**: `/home/zemul/Programming/research/backend/server.py`
- **Models**: `/home/zemul/Programming/research/backend/database/models.py`

### Testing
- **Backend**: `/home/zemul/Programming/research/backend/tests/` (minimal)
- **Frontend**: No test files detected

## Naming Conventions

### Files
- **Services**: `*_service.py` (consistent)
- **APIs**: `*_api.py` (consistent)
- **Models**: `*_models.py` (inconsistent - some files lack suffix)
- **Frontend**: PascalCase components, camelCase utilities

### Directories
- **Backend**: snake_case (consistent)
- **Frontend**: PascalCase components directory (inconsistent with backend)

## Where to Add New Code

### New Feature
- **Backend Services**: `/home/zemul/Programming/research/backend/*_service.py`
- **API Endpoints**: `/home/zemul/Programming/research/backend/server.py`
- **Database Models**: `/home/zemul/Programming/research/backend/database/models.py`
- **Frontend Components**: `/home/zemul/Programming/research/frontend/src/components/`

### New Component/Module
- **Implementation**: `/home/zemul/Programming/research/frontend/src/components/`
- **Tests**: `/home/zemul/Programming/research/backend/tests/` (if any)

### Utilities
- **Shared helpers**: `/home/zemul/Programming/research/frontend/src/lib/utils.js`
- **API clients**: `/home/zemul/Programming/research/frontend/src/lib/api.js`

## Special Directories

### Backend Services Directory
- **Purpose**: Contains 15+ service files
- **Generated**: No
- **Committed**: Yes
- **Issue**: Too many services, unclear boundaries

### Frontend Components Directory
- **Purpose**: UI components organized by feature
- **Generated**: No
- **Committed**: Yes
- **Structure**: Nested by feature type (ui/, pages/, etc.)

### Database Directory
- **Purpose**: Data access layer
- **Generated**: No
- **Committed**: Yes
- **Models**: Split across multiple files for different features

## Structure Issues

### Misplaced Files
- **Issue**: API endpoints mixed with service logic in server.py
- **Solution**: Extract routes to separate modules

### Inconsistent Organization
- **Issue**: Database models scattered across multiple files
- **Solution**: Consolidate or establish clear boundaries

### Confusing Multiple Frontends
- **Issue**: Three separate frontend implementations
- **Solution**: Choose primary and deprecate others

### Navigation Challenges
- **Issue**: Deep nesting in some areas, flat structure in others
- **Solution**: Establish consistent depth and grouping patterns

---

*Structure analysis: 2026-02-11*
