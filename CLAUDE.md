# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` - Start development server (runs on localhost:3000, proxies API to localhost:8000)
- `npm run build` - Build for production
- `npm test` - Run Jest tests
- `npx playwright test` - Run end-to-end tests
- `sh/restart_backend_server.sh` - Restart the R Plumber backend server (required for testing changes)

## Architecture Overview

This is a Create React App (CRA) frontend for visualizing phylogenetic trees. The app follows a component-based architecture with localized state management using React hooks.

### Core Components Structure
- `App.js` - Root component with routing (`/` and `/about`) and global tree view state
- `EvolutionMapper.js` - Main application logic containing species selection, tree generation, and floating toolbar
- `Navigation.js` - Simple routing navigation (hidden in tree view)
- `ProgressChecklist.js` - Real-time progress visualization during tree generation

### State Management
- Uses React hooks (`useState`, `useEffect`) for local state management
- No global state library - state is centralized in `EvolutionMapper.js`
- State flows down via props, callbacks flow up (e.g., `onTreeViewChange`)

### API Integration
- All API logic centralized in `src/api-config.js`
- Uses `apiRequest` function with built-in error handling for 401/429 responses
- Backend runs on localhost:8000, proxied during development
- Progress polling for long-running tree generation via `/api/progress` endpoint
- Never hardcode API keys - always use `process.env.REACT_APP_API_KEY`

### Key Features
- Species search with `react-select` AsyncSelect component
- Requires 3-20 species selection for tree generation
- Floating toolbar mode for tree interaction
- Progress checklist with real-time status updates
- Tree display via iframe with dynamic HTML content

### Testing
- End-to-end tests with Playwright in `tests/` directory
- Tests cover: species selection, tree generation, error handling, UI interactions
- Run tests with `npx playwright test`
- For frontend testing of `/api/full-tree-dated`, use the frontend at localhost:3000 with species input via browser console: `as("Human (Homo sapiens), Chicken (Gallus gallus), Chimpanzee (Pan troglodytes)")`
- Restart backend before testing changes: `sh/restart_backend_server.sh`

### Dependencies
- `react-select` for species search/selection
- `react-router-dom` for client-side routing
- `playwright` for E2E testing
- Backend proxy configured to localhost:8000 for API requests

## Environment Configuration
- Environment variables configured in `.env` (API keys, backend URL)
- Never hardcode API keys - always use `process.env.REACT_APP_API_KEY`
- Backend is R Plumber API serving phylogenetic tree data for 90k+ species
- Use `REACT_APP_BACKEND_URL` to override default localhost:8000 backend

## Important Development Notes
- Never hardcode species names - database contains 90k+ species
- For large API responses (like `/api/full-tree-dated`), test via frontend rather than direct API calls
- Backend restart required when testing API changes: `sh/restart_backend_server.sh`
- Tree generation is asynchronous with progress polling via `/api/progress` endpoint