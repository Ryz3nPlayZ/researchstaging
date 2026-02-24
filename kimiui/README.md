# Kimi UI

An alternative, dark-themed UI for Research Pilot - the AI-native research execution system.

## Overview

Kimi UI provides a fresh interface to the Research Pilot backend with:

- 🎨 Dark, modern aesthetic with purple accents
- ⚡ Built with Vite + React + TypeScript
- 🔄 Real-time updates via WebSocket
- 📱 Responsive design
- 🎯 Same powerful backend, different experience

## Quick Start

From the project root directory:

```bash
./run-kimiui.sh
```

This starts both:
- Backend on http://localhost:8000
- Kimi UI on http://localhost:3456

## Features

### Dashboard
- Overview stats
- Quick actions
- Recent projects

### Projects
- Create new research projects
- View all projects with filtering
- Detailed project view with:
  - Task management
  - Artifact viewing
  - Paper discovery
  - Execution logs
  - Real-time updates

### Papers
- View all papers across projects
- Search and filter

### Activity
- Recent execution logs
- Activity feed

## Architecture

```
kimiui/
├── src/
│   ├── api/          # API client connecting to backend
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── store/        # Zustand state management
│   ├── styles/       # CSS styles
│   ├── types/        # TypeScript types
│   └── utils/        # Utility functions
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Development

```bash
cd kimiui
npm install
npm run dev
```

The dev server runs on port 3456 and proxies API calls to localhost:8000.

## Tech Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Routing**: React Router
- **Icons**: Lucide React

## Authentication

Uses the same mock authentication as the main frontend:
- Any email works for local development
- Token stored in localStorage

## API Connection

Kimi UI connects to the existing Research Pilot backend:
- Base URL: `http://localhost:8000/api`
- WebSocket: `ws://localhost:8000/ws/{project_id}`
- All existing endpoints are supported

## Comparison with Original Frontend

| Feature | Original Frontend | Kimi UI |
|---------|------------------|---------|
| Design | Light, clean | Dark, techy |
| Framework | Next.js | Vite + React |
| Auth | Same | Same |
| API | Same | Same |
| Real-time | WebSocket | WebSocket |

## License

Same as Research Pilot project.
