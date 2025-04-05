# TASK-01.7: Knowledge Base Integration

**Status:** 🔴 Not Started
**Priority:** P2: Medium
**Parent Epic:** [EPIC-01: UI-Backend Integration](EPIC-01-UI-Backend-Integration.md)
**Depends On:** [TASK-01.3: Frontend API Service Module](TASK-01.3-Frontend-API-Service.md)
**Related Feature:** [12-KNOWLEDGE-BASE.md](../00-FEATURE-LIST.md)
**Assignee:** TBD
**Estimate:** 3-4 hours

## Goal

Integrate the Knowledge Base search functionality into the frontend UI. This involves adding a backend API endpoint to trigger the `knowledge_query` tool (or directly use the `KnowledgeManager`), creating a corresponding frontend API service function, and connecting the UI component to perform searches and display results.

## Sub-Tasks

1.  **Backend: Define `POST /api/search/knowledge` Endpoint:**
    *   In `server/index.ts`, define a new route handler for `POST /api/search/knowledge`.
    *   Expect a JSON body like `{ query: string, limit?: number, types?: string[], tags?: string[] }`. Validate the input.
    *   Inside the handler, access the initialized `knowledgeManager` instance from the `AgentOrchestrator` (or directly).
    *   Call `knowledgeManager.searchKnowledge(query, { limit, types, tags })`.
    *   Handle potential errors during the search.
    *   Return the search results (array of `KnowledgeSearchResult`) as JSON.
    *   *Alternative:* If using the tool approach, construct a `ToolCall` for `knowledge_query` and execute it via the orchestrator similar to the code search task. Choose the approach that seems cleaner. Direct manager access might be simpler here.

2.  **Frontend: Add `searchKnowledge` API Function:**
    *   In `app/services/api.ts`, define an async function `searchKnowledge(query: string, options?: { limit?: number, types?: string[], tags?: string[] }): Promise<KnowledgeSearchResult[]>` (import `KnowledgeSearchResult` type).
    *   Make a `POST` request to `/search/knowledge` using the Axios instance, sending `{ query, ...options }` in the body.
    *   Return the array of `KnowledgeSearchResult` objects from the response data.
    *   Handle potential API errors.

3.  **Identify Knowledge Base UI Component:**
    *   Locate the React component responsible for the knowledge base search input and results display (e.g., `app/components/sections/KnowledgeBase.tsx`).

4.  **Implement Search Input:**
    *   Ensure there's an input field for the knowledge search query.
    *   Manage the input field's state.
    *   (Optional) Add UI elements for filtering by type or tags.

5.  **Handle Search Execution:**
    *   Implement the `onSubmit` handler for the search input/form or a search button's `onClick` handler.
    *   When the user initiates a search:
        *   Get the query and any filter options from the UI state.
        *   Set a loading state.
        *   Call the `searchKnowledge(query, options)` function from the API service.
        *   Update the component's state with the received search results.
        *   Clear the loading state.
        *   Handle potential errors from the API call.

6.  **Display Search Results:**
    *   Modify the component's render logic to display the list of `KnowledgeSearchResult` results.
    *   For each result, display relevant information from the `item` (e.g., content snippet, type, source, tags) and the `score`.
    *   Handle the case where no results are found.

7.  **Refactor Existing Logic:**
    *   Remove any previous mock knowledge base data or logic within the component.

8.  **Verification:**
    *   Run the frontend and backend servers concurrently.
    *   Ensure the backend's `KnowledgeManager` and vector database have some indexed knowledge items (manual setup or running importers might be needed for testing).
    *   Use the search input in the UI to perform a query.
    *   Verify:
        *   A request is sent to `POST /api/search/knowledge`.
        *   The backend performs the knowledge search.
        *   Search results returned by the backend are displayed correctly in the UI.
    *   Test with queries that yield results and queries that yield no results.
    *   Verify loading indicators and basic error handling work.

## Definition of Done

- Backend endpoint `POST /api/search/knowledge` is implemented and successfully performs searches using the `KnowledgeManager`.
- Frontend API service function `searchKnowledge` is implemented and communicates with the backend endpoint.
- Knowledge Base UI component allows users to input queries.
- Search results fetched from the backend are displayed in the UI.
- Loading and error states are handled visually.
- Previous mock knowledge base logic is removed.

## Notes

- For MVP testing, manually adding a few knowledge items via the `KnowledgeManager` or ensuring its importers (`extractKnowledgeFromDocument`, etc.) have run on sample data might be necessary.
- The display of knowledge items can be simple text initially. Richer rendering (e.g., Markdown) can be added later.
