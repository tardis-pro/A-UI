# TASK-01.5: Code Search Integration

**Status:** 🔴 Not Started
**Priority:** P1: High
**Parent Epic:** [EPIC-01: UI-Backend Integration](EPIC-01-UI-Backend-Integration.md)
**Depends On:** [TASK-01.3: Frontend API Service Module](TASK-01.3-Frontend-API-Service.md)
**Related Feature:** [17-CODE-SEARCH.md](../00-FEATURE-LIST.md)
**Assignee:** TBD
**Estimate:** 3-4 hours

## Goal

Integrate the code search functionality into the frontend UI. This involves adding an API endpoint on the backend to trigger the `code_search` tool via the orchestrator, creating a corresponding function in the frontend API service, and connecting the UI component to perform searches and display results.

## Sub-Tasks

1.  **Backend: Define `POST /api/search/code` Endpoint:**
    *   In `server/index.ts`, define a new route handler for `POST /api/search/code`.
    *   Expect a JSON body like `{ query: string, limit?: number, language?: string }`. Validate the input.
    *   Inside the handler, manually construct a `ToolCall` object for the `code_search` tool using the request parameters.
        *   `tool: 'code_search'`
        *   `parameters: { query, limit, language }`
    *   Call the *internal* `executeToolCall` method of the `AgentOrchestrator` instance directly (or refactor `AgentOrchestrator` to expose a dedicated method for executing tools outside the chat flow if cleaner).
        *   *Note:* This bypasses the LLM parsing and approval flow for direct tool use via API, which is suitable for specific UI actions like search. We'll need a dummy message ID or adapt `executeToolCall` if it strictly requires one.
    *   Handle the `ToolResult` returned by `executeToolCall`.
    *   If `result.success` is true, return the search results (`result.data`) as JSON.
    *   If `result.success` is false, return an appropriate error status code and the error message (`result.error`).

2.  **Frontend: Add `searchCode` API Function:**
    *   In `app/services/api.ts`, define an async function `searchCode(query: string, limit?: number, language?: string): Promise<CodeChunk[]>` (import `CodeChunk` type).
    *   Make a `POST` request to `/search/code` using the Axios instance, sending `{ query, limit, language }` in the body.
    *   Return the array of `CodeChunk` objects from the response data.
    *   Handle potential API errors.

3.  **Identify Code Search UI Component:**
    *   Locate the React component responsible for the code search input and results display (this might be part of `LandingPage.tsx`, `MainContent.tsx`, or a dedicated search component).

4.  **Implement Search Input:**
    *   Ensure there's an input field for the search query.
    *   Manage the input field's state.

5.  **Handle Search Execution:**
    *   Implement the `onSubmit` handler for the search input/form or a search button's `onClick` handler.
    *   When the user initiates a search:
        *   Get the query from the input state.
        *   Set a loading state.
        *   Call the `searchCode(query)` function from the API service.
        *   Update the component's state with the received search results.
        *   Clear the loading state.
        *   Handle potential errors from the API call.

6.  **Display Search Results:**
    *   Modify the component's render logic to display the list of `CodeChunk` results.
    *   For each result, display relevant information (e.g., file path, function/class name, snippet of the code content).
    *   Handle the case where no results are found.

7.  **Refactor Existing Logic:**
    *   Remove any previous mock search data or logic within the component.

8.  **Verification:**
    *   Run the frontend and backend servers concurrently.
    *   Ensure the backend's vector database has some indexed code (manual setup might be needed for testing if indexing isn't automated yet).
    *   Use the search input in the UI to perform a query.
    *   Verify:
        *   A request is sent to `POST /api/search/code`.
        *   The backend executes the `code_search` tool.
        *   Search results returned by the backend are displayed correctly in the UI.
    *   Test with queries that yield results and queries that yield no results.
    *   Verify loading indicators and basic error handling work.

## Definition of Done

- Backend endpoint `POST /api/search/code` is implemented and successfully executes the `code_search` tool via the orchestrator.
- Frontend API service function `searchCode` is implemented and communicates with the backend endpoint.
- Code search UI component allows users to input queries.
- Search results fetched from the backend are displayed in the UI.
- Loading and error states are handled visually.
- Previous mock search logic is removed.

## Notes

- The backend implementation needs careful handling of how to invoke `executeToolCall` outside the normal LLM response flow. Consider adding a dedicated orchestrator method like `orchestrator.runTool(toolName, parameters)`.
- Displaying code snippets might require a syntax highlighting component (e.g., `react-syntax-highlighter`).
- For MVP testing, manually populating the vector DB or ensuring the `codeChunker` runs on some sample files might be necessary.
