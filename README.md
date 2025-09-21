# Evolution Mapper Frontend

A React application that visualizes how species evolved by creating interactive phylogenetic trees. This frontend interfaces with an R Plumber backend that serves phylogenetic data for over 90,000 species.

## Features

- **Multi-species selection**: Select between 3-20 species using an async search picker
- **Species search**: Real-time search through 90k+ species with common and scientific names
- **Interactive evolution trees**: Generate and display interactive phylogenetic trees with legends
- **Random species selection**: Let the app pick random species for you
- **Floating toolbar**: Interactive controls when viewing trees
- **Progress tracking**: Real-time progress updates during tree generation
- **Legend system**: Color-coded legends with species categorization
- **Responsive design**: Works on desktop and mobile devices

## Setup

### Prerequisites
- Node.js (for frontend)
- R with Plumber package (for backend)
- Valid API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd evolution-mapper-frontend
   npm install
   ```

2. **Environment configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your API key:
   # REACT_APP_API_KEY=your-api-key-here
   ```

3. **Start the backend server:**
   ```bash
   sh/restart_backend_server.sh
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

   The app will open at `http://localhost:3000` and proxy API requests to `http://localhost:8000`

## Usage

1. **Search and select species**: Use the search box to find species by common or scientific name
2. **Select 3-20 species**: The app requires at least 3 species to generate a tree
3. **Generate tree**: Click "Show me how they evolved!" to create the phylogenetic tree
4. **Try random selection**: Click "Pick species for me" to populate with random species
5. **Interactive tree view**: Use the floating toolbar to interact with generated trees
6. **Legend controls**: Toggle legend visibility and explore species categorization

## Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run Jest tests
- `npx playwright test` - Run end-to-end tests

### Testing

For testing API endpoints that return large responses (like `/api/full-tree-dated`):
1. Start the frontend: `npm start`
2. Navigate to `http://localhost:3000`
3. Use browser console to input species: `as("Human (Homo sapiens), Chicken (Gallus gallus)")`
4. Screenshot the results for verification

### Backend Integration

The app connects to an R Plumber backend serving phylogenetic data:
- **Backend URL**: `http://localhost:8000` (configurable via `REACT_APP_BACKEND_URL`)
- **API Key**: Set via `REACT_APP_API_KEY` environment variable
- **Restart backend**: Use `sh/restart_backend_server.sh` when testing changes

## Architecture

- **Frontend**: Create React App with component-based architecture
- **State Management**: React hooks (useState, useEffect) - no global state library
- **API Layer**: Centralized in `src/api-config.js` with error handling
- **Testing**: Playwright for E2E tests, Jest for unit tests
- **Backend**: R Plumber API serving 90k+ species data

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_KEY` | API key for backend authentication | `demo-key-12345` |
| `REACT_APP_BACKEND_URL` | Backend API URL | `http://localhost:8000` |

## Technologies Used

- **Frontend**: React 18, React Router v7, React Select
- **Testing**: Playwright, Jest, React Testing Library
- **Backend**: R Plumber API
- **Build**: Create React App