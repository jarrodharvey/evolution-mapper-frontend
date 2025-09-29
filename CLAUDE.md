# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` - Start development server on localhost:3000 (proxies to backend at localhost:8000)
- `sh/restart_backend_server.sh` - Restart R Plumber backend server (required after API changes)

### Testing
- `npm test` - Run Jest unit tests
- `npx playwright test` - Run end-to-end browser tests
- Testing the full tree API: Use frontend at localhost:3000, restart backend first, then test using browser console with `as("species1, species2, species3")` format

### Build and Quality
- `npm run build` - Create production build
- No explicit lint/typecheck commands (uses CRA defaults)

## Architecture

### Application Structure
This is a React frontend for phylogenetic tree visualization with dual rendering modes:
- **Desktop**: iframe-based HTML tree rendering for complex visualizations
- **Mobile**: Material-UI TreeView component with JSON data for better mobile UX

### Key Components
- `EvolutionMapper.js` - Main orchestration component with tree generation logic
- `api-config.js` - Centralized API configuration and error handling
- `components/PhylogeneticTreeView.js` - Tree visualization component with responsive modes
- `components/InfoPanel.js` - Species information and legend display

### Backend Integration
- R Plumber API backend required for functionality
- API key authentication via `REACT_APP_API_KEY` (stored in .env, not .env.example)
- Development proxy: requests to `/api/*` forwarded to localhost:8000
- Real-time progress tracking via polling during tree generation

### Database Constraints
- **Never hardcode species names** - there are 90k+ species in the database
- Solutions must work dynamically with the full species dataset
- Use async search functionality for species selection

### Environment Configuration
Key environment variables (set in .env):
- `REACT_APP_API_KEY` - Backend authentication token
- `REACT_APP_BACKEND_URL` - Override API endpoint (optional)
- `REACT_APP_BACKEND_PORT` - Backend port (default 8000)

### Testing Conventions
- E2E tests in `/tests/` directory using Playwright
- Never hardcode test species - use dynamic selection
- For API testing, prefer frontend testing at localhost:3000 over direct API calls
- Screenshot capture for manual verification stored in `/screenshots/`

### Error Handling
- No graceful fallbacks during development - explicit errors preferred for debugging
- Centralized API error handling in `api-config.js`
- Separate error states for different UI areas (search, tree generation, display)

### Mobile Optimization
- Responsive design with separate rendering paths
- Mobile detection utilities in `src/utils/`
- TreeView component for mobile, iframe for desktop
- Touch-friendly interactions and zoom handling