# TASK-01.1: Backend Server Setup

**Status:** 🔴 Not Started
**Priority:** P0: Critical
**Parent Epic:** [EPIC-01: UI-Backend Integration](EPIC-01-UI-Backend-Integration.md)
**Assignee:** TBD
**Estimate:** 2-4 hours

## Goal

Set up the basic structure for the Node.js backend server using TypeScript and Express. This includes directory creation, dependency installation, basic configuration, and ensuring the server can start.

## Sub-Tasks

1.  **Create Server Directory:**
    *   Create a new directory named `server/` at the project root.

2.  **Initialize Node.js Project:**
    *   Decide whether to manage backend dependencies in `server/package.json` or the root `package.json`. (Recommendation: Use root `package.json` for simplicity in a monorepo-like structure, unless the backend becomes significantly complex later).
    *   If using root `package.json`, ensure `type: "module"` is set (already present).

3.  **Install Dependencies:**
    *   Install runtime dependencies: `pnpm install express cors axios`
    *   Install development dependencies: `pnpm install -D typescript @types/node @types/express @types/cors ts-node nodemon` (Nodemon for auto-reloading during development).

4.  **Configure TypeScript (`tsconfig.server.json`):**
    *   Create a `tsconfig.server.json` file (or similar name) specifically for the backend.
    *   Configure it to:
        *   Extend the root `tsconfig.json` if appropriate.
        *   Set `module` to `NodeNext` or `ESNext` (to support ES module syntax with Node.js).
        *   Set `moduleResolution` to `NodeNext` or `Bundler`.
        *   Set `outDir` to `./server/dist`.
        *   Set `rootDir` to `./server`.
        *   Include `server/**/*.ts`.
        *   Exclude `node_modules`, `app`, `src`, etc.

5.  **Create Basic Server File (`server/index.ts`):**
    *   Import `express` and `cors`.
    *   Create an Express application instance.
    *   Enable CORS middleware (`app.use(cors())`).
    *   Add a basic health check endpoint (e.g., `GET /health` returning `{ status: 'ok' }`).
    *   Define the server port (e.g., `3001` from environment variable or default).
    *   Start the server listening on the defined port.
    *   Include basic logging (e.g., `console.log`) for server start.

6.  **Add Build/Start Scripts (`package.json`):**
    *   Add a script to compile the backend TypeScript: `"build:backend": "tsc -p tsconfig.server.json"`
    *   Add a script to start the compiled backend: `"start:backend": "node server/dist/index.js"`
    *   Add a script for development using `ts-node` or `nodemon`: `"dev:backend": "nodemon --watch 'server/**/*.ts' --exec 'ts-node' server/index.ts"` (Adjust `ts-node` usage based on ES module setup).

7.  **Verification:**
    *   Run `pnpm run build:backend` to ensure compilation succeeds.
    *   Run `pnpm run start:backend` and verify the server starts and logs the listening port.
    *   Access the `/health` endpoint (e.g., `curl http://localhost:3001/health`) and verify the `ok` status.
    *   Run `pnpm run dev:backend` and verify the server starts and restarts automatically upon saving changes to `server/index.ts`.

## Definition of Done

- `server/` directory exists.
- Required dependencies are installed.
- `tsconfig.server.json` is configured correctly.
- `server/index.ts` contains a basic Express server setup with CORS and a health check endpoint.
- `package.json` scripts for building, starting, and developing the backend are functional.
- The server can be successfully built and started.
- The health check endpoint is accessible and returns the correct status.
- Development server restarts on file changes.

## Notes

- Ensure Node.js version compatibility (recommend LTS).
- Consider environment variables for configuration (e.g., port number) using `dotenv` if needed later.
