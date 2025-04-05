# TASK-01.9: Concurrency Setup for Development

**Status:** 🔴 Not Started
**Priority:** P1: High
**Parent Epic:** [EPIC-01: UI-Backend Integration](EPIC-01-UI-Backend-Integration.md)
**Depends On:** [TASK-01.1: Backend Server Setup](TASK-01.1-Backend-Server-Setup.md)
**Assignee:** TBD
**Estimate:** 1-2 hours

## Goal

Configure the project's `package.json` scripts to allow developers to easily start both the frontend (Vite) and backend (Node.js/Express) development servers concurrently with a single command.

## Sub-Tasks

1.  **Install `concurrently`:**
    *   Verify `concurrently` is listed in the root `package.json` devDependencies. If not, install it: `npm install -D concurrently`.

2.  **Verify/Refine Individual Dev Scripts:**
    *   Ensure the script for starting the frontend dev server works correctly (e.g., `"dev:frontend": "vite"` - Vite's default `dev` script might already be sufficient).
    *   Ensure the script for starting the backend dev server (with auto-reloading) works correctly (e.g., `"dev:backend": "nodemon --watch 'server/**/*.ts' --exec 'ts-node' server/index.ts"` - created in TASK-01.1). Adjust if necessary based on final backend setup.

3.  **Create Main `dev` Script:**
    *   Modify or create the main `dev` script in the root `package.json`.
    *   Use `concurrently` to run both the `dev:frontend` and `dev:backend` scripts simultaneously.
    *   Example: `"dev": "concurrently \"npm:dev:backend\" \"npm:dev:frontend\""`
    *   Consider adding options to `concurrently` for better output handling:
        *   `--kill-others-on-fail`: Stops all processes if one fails.
        *   `--prefix \"[{name}]\"`: Adds prefixes (e.g., `[backend]`, `[frontend]`) to output lines.
        *   `--names \"backend,frontend\"`: Assigns names for prefixes.
        *   `--prefix-colors \"blue,green\"`: Assigns colors to prefixes.
    *   Final example: `"dev": "concurrently --kill-others-on-fail --prefix \"[{name}]\" --names \"backend,frontend\" --prefix-colors \"blue,green\" \"npm:dev:backend\" \"npm:dev:frontend\""`

4.  **Documentation (README):**
    *   Update the project's main `README.md` (or a `CONTRIBUTING.md`) to explain how to start the development environment using the new `npm run dev` command.
    *   Mention any prerequisites (e.g., Node.js version, running Ollama).

5.  **Verification:**
    *   Run `npm run dev`.
    *   Verify that both the backend server and the frontend Vite server start successfully.
    *   Verify that output from both servers is visible in the terminal, preferably prefixed and color-coded.
    *   Make a change to a backend file (`server/index.ts`) and verify `nodemon` restarts the backend server automatically.
    *   Make a change to a frontend file (`app/App.tsx`) and verify Vite performs Hot Module Replacement (HMR).
    *   Stop the combined process (Ctrl+C) and verify both servers shut down cleanly.

## Definition of Done

- `concurrently` dependency is installed.
- Individual `dev:frontend` and `dev:backend` scripts are functional.
- The main `npm run dev` script successfully starts both frontend and backend servers concurrently using `concurrently`.
- Terminal output is clearly distinguishable between the frontend and backend processes.
- Auto-reloading works for both frontend (HMR) and backend (nodemon restart).
- The combined process can be stopped cleanly.
- Project documentation explains how to use `npm run dev`.

## Notes

- Ensure the ports used by the frontend (e.g., 5173 or 3000) and backend (e.g., 3001) do not conflict.
- The exact `nodemon` and `ts-node` command might need adjustments depending on the TypeScript/Node.js module system configuration (`tsconfig.server.json`).
