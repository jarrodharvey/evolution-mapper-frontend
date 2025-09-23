# Repository Guidelines

Reference this guide before contributing to Evolution Mapper’s front-end.

## Project Structure & Architecture
- `src/` holds React views, `components/` widgets, `utils/` helpers, and `api-config.js` for API glue; `App.js` covers routing, `EvolutionMapper.js` orchestrates tree logic, and `ProgressChecklist.js` surfaces status.
- `public/` stores CRA shell assets; update favicons or logos here.
- `tests/` contains Playwright specs with artifacts in `test-results/`.
- `api-config.example.js` lists env vars—copy to `src/api-config.js` for local overrides.

## Build, Test, and Backend Commands
- `npm install` syncs dependencies after each `git pull`.
- `npm start` runs the CRA dev server on `localhost:3000`, proxying to the backend at `localhost:8000`.
- `npm run build` emits production assets into `build/` (never edit output manually).
- `npm test` launches Jest with React Testing Library; add `-- --watchAll=false` for a single CI-style run.
- `npx playwright test` executes the browser regression suite (bootstrap once via `npx playwright install`).
- `sh/restart_backend_server.sh` restarts the R Plumber backend—run before validating API or tree changes.

## Coding Style & Naming Conventions
- Use 2-space indentation and rely on CRA ESLint defaults (`react-app`, `react-app/jest`).
- Name components and files in PascalCase (e.g., `ProgressOverlay.js`) with paired styles as `ComponentName.css`.
- Export utilities from `src/utils` using camelCase and prefix custom hooks with `use`.
- Keep `node-fetch` inside API helpers so UI components stay presentation-focused.

## Testing Guidelines
- Co-locate component tests when helpful; name them `ComponentName.test.js`.
- Keep Playwright specs as `*.spec.js` under `tests/`, grouping related checks in logical blocks.
- Run `npm test` and `npx playwright test` before committing, capturing output or screenshots for failures.

## API & Domain Practices
- Never hardcode species names or API keys—load credentials via `process.env.REACT_APP_API_KEY` and override endpoints with `REACT_APP_BACKEND_URL` when needed.
- Tree generation accepts 3–20 species and streams progress via `/api/progress`; adjust polling or UX with care.
- Exercise full API checks through the UI to keep iframe rendering and backend polling aligned.
- Keep API changes centralized in `src/api-config.js`, layering guards for 401/429 responses when extending logic.

## Commit & Pull Request Guidelines
- Follow the repo’s subject style: concise, sentence-case imperatives (e.g., “Improve legend layout”).
- Reference issues with `Refs #123` when applicable and explain user-visible impact in the body.
- Attach verification details (`npm test`, Playwright results, backend restart notes) and screenshots for UI changes from `screenshots/`.
- PR descriptions should outline scope, list remaining TODOs, and highlight new configuration or env vars.
