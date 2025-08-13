# Evolution Mapper Frontend

A React application that visualizes how species evolved by creating interactive phylogenetic trees.

## Features

- **Multi-species selection**: Select between 3-20 species using an async search picker
- **Species search**: Real-time search through thousands of species with scientific names
- **Interactive evolution trees**: Generate and display interactive phylogenetic trees
- **Random species selection**: Let the app pick random species for you
- **Responsive design**: Works on desktop and mobile devices

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Make sure the backend is running:**
   The app expects the Evolution Mapper API to be running at `http://localhost:8000`

## Usage

1. **Search and select species**: Use the search box to find species by common or scientific name
2. **Select 3-20 species**: The app requires at least 3 species to generate a tree
3. **Generate tree**: Click "Show me how they evolved!" to create the phylogenetic tree
4. **Try random selection**: Click "Pick species for me" to populate with random species

## API Configuration

The app uses the API configuration in `api-config.js`. Update this file to change:
- API base URL
- API key
- Request timeouts
- Search parameters

## Technologies Used

- React 18
- React Select (async multi-select)
- HTML5/CSS3
- Fetch API for HTTP requests