# TASK-01.2: API Definition & Implementation

**Status:** 🔴 Not Started
**Priority:** P0: Critical
**Parent Epic:** [EPIC-01: UI-Backend Integration](EPIC-01-UI-Backend-Integration.md)
**Depends On:** [TASK-01.1: Backend Server Setup](TASK-01.1-Backend-Server-Setup.md)
**Assignee:** TBD
**Estimate:** 4-6 hours

## Goal

Define and implement the core REST API endpoints on the backend server required for the MVP integration. This includes initializing the `AgentOrchestrator` and handling requests for chat processing and conversation retrieval.

## Sub-Tasks

1.  **Initialize AgentOrchestrator:**
    *   In `server/index.ts`, import `AgentOrchestrator` from `../store/orchestrator.ts`.
    *   Import necessary providers/dependencies (e.g., `OllamaProvider` from `../store/ai.ts`).
    *   Instantiate the `OllamaProvider` (or other configured local LLM provider).
    *   Instantiate `AgentOrchestrator`, passing the LLM provider and configuring data directory paths (e.g., `.aui-data` relative to the project root).
    *   Call `await orchestrator.initialize()` after the server starts or within an async setup function. Handle potential initialization errors.

2.  **Define API Routes:**
    *   Set up Express router or define routes directly in `server/index.ts`.
    *   Use `express.json()` middleware to parse JSON request bodies.

3.  **Implement `POST /api/chat` Endpoint:**
    *   Define the route handler for `POST /api/chat`.
    *   Expect a JSON body like `{ message: string }`. Validate the input.
    *   Call `orchestrator.processUserMessage(req.body.message)`.
    *   Handle potential errors during message processing.
    *   Return the assistant's response message (from the `processUserMessage` result) as JSON (e.g., `{ response: Message }`).
    *   Consider adding basic request validation (e.g., ensure `message` is a non-empty string).

4.  **Implement `GET /api/conversation` Endpoint:**
    *   Define the route handler for `GET /api/conversation`.
    *   Call `orchestrator.getActiveConversation()`.
    *   Return the conversation object as JSON (or an empty object/null if no active conversation exists).

5.  **Implement Basic Error Handling:**
    *   Add a simple Express error handling middleware to catch unhandled errors and return a generic 500 response.
    *   Ensure API endpoints return appropriate status codes (e.g., 200 for success, 400 for bad requests, 500 for server errors).

6.  **Refine Orchestrator Paths:**
    *   Double-check that all paths used within the `AgentOrchestrator` and its dependencies (VectorDB, KnowledgeManager, etc.) are correctly resolved relative to the project root where the backend server process runs. Adjust constructor options or internal logic if needed.

7.  **API Documentation (Basic):**
    *   Add comments in `server/index.ts` or a simple `API.md` file outlining the available endpoints, expected request formats, and example responses.

8.  **Verification:**
    *   Start the backend server (`npm run dev:backend`).
    *   Use `curl` or a tool like Postman/Insomnia to:
        *   Send a `POST` request to `/api/chat` with a test message and verify a valid assistant response is received.
        *   Send a `GET` request to `/api/conversation` and verify the current conversation state is returned.
        *   Send invalid requests (e.g., missing body to `/api/chat`) and verify appropriate error responses (e.g., 400).

## Definition of Done

- `AgentOrchestrator` is successfully initialized within the backend server.
- `POST /api/chat` endpoint is implemented, processes user messages via the orchestrator, and returns the assistant's response.
- `GET /api/conversation` endpoint is implemented and returns the current conversation state.
- Basic API input validation and error handling are in place.
- Paths used by the orchestrator and its dependencies are correctly configured.
- API endpoints are documented minimally.
- Endpoints can be successfully tested using `curl` or a similar tool.

## Notes

- This task focuses on the core chat and conversation retrieval. Endpoints for other features (search, CI/CD, etc.) will be added in subsequent tasks.
- Streaming responses for `/api/chat` are not required for this task but can be added later.
- Ensure Ollama (or the configured local LLM) is running and accessible by the backend server during testing.
