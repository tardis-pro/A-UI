# TASK-01.3: Frontend API Service Module

**Status:** 🔴 Not Started
**Priority:** P0: Critical
**Parent Epic:** [EPIC-01: UI-Backend Integration](EPIC-01-UI-Backend-Integration.md)
**Depends On:** [TASK-01.2: API Definition & Implementation](TASK-01.2-API-Definition.md)
**Assignee:** TBD
**Estimate:** 2-3 hours

## Goal

Create a dedicated service module within the React frontend (`app/`) to handle all communication with the backend API. This centralizes API logic and provides typed functions for components to use.

## Sub-Tasks

1.  **Install Axios (if not already present):**
    *   Verify `axios` is listed in the root `package.json` dependencies. If not, install it: `npm install axios`.

2.  **Create API Service Directory/File:**
    *   Create a new directory `app/services/`.
    *   Create a file `app/services/api.ts`.

3.  **Configure Axios Instance:**
    *   In `app/services/api.ts`, import `axios`.
    *   Create an Axios instance configured with the backend base URL (e.g., `http://localhost:3001/api`). Use environment variables (`import.meta.env.VITE_API_BASE_URL`) for flexibility.
    *   Configure default headers if necessary (e.g., `Content-Type: application/json`).
    *   Consider adding basic interceptors for logging or error handling later.

4.  **Implement `sendChatMessage` Function:**
    *   Define an async function `sendChatMessage(message: string): Promise<Message>` (import `Message` type from `store/types.ts` or a shared types location).
    *   Make a `POST` request to `/chat` using the Axios instance, sending `{ message }` in the body.
    *   Extract the assistant's response message from the backend response data (e.g., `response.data.response`).
    *   Return the assistant's `Message` object.
    *   Include basic error handling (e.g., log errors, potentially throw a custom error).

5.  **Implement `getConversation` Function:**
    *   Define an async function `getConversation(): Promise<Conversation | null>` (import `Conversation` type).
    *   Make a `GET` request to `/conversation` using the Axios instance.
    *   Return the conversation object from the response data (e.g., `response.data`).
    *   Handle cases where no conversation exists (backend might return null or empty object).
    *   Include basic error handling.

6.  **Define Shared Types:**
    *   Ensure that types used in API communication (`Message`, `Conversation`, etc.) are accessible to both the frontend (`app/`) and backend (`server/`).
    *   Consider moving relevant types from `store/types.ts` to a shared location (e.g., `types/` at the root) or duplicating them carefully if a shared location is complex to set up initially. (For MVP, referencing `store/types.ts` might be acceptable if paths resolve correctly, but a shared location is better practice).

7.  **Export API Functions:**
    *   Export the implemented functions (`sendChatMessage`, `getConversation`) from `app/services/api.ts`.

8.  **Verification:**
    *   Temporarily import and call the API functions from a test component or during app initialization (ensure the backend server is running).
    *   Use browser developer tools (Network tab) to inspect the requests and responses.
    *   Verify that the functions return data in the expected format (matching the defined types).
    *   Test error handling by stopping the backend server and verifying errors are caught.

## Definition of Done

- `axios` dependency is installed.
- `app/services/api.ts` file exists.
- An Axios instance is configured with the correct base URL.
- `sendChatMessage` function is implemented and makes the correct `POST` request.
- `getConversation` function is implemented and makes the correct `GET` request.
- Functions handle responses and basic errors correctly.
- Shared types (`Message`, `Conversation`) are accessible and used for function signatures/return types.
- API functions are exported correctly.
- Basic verification confirms functions communicate with the (running) backend.

## Notes

- This task focuses only on creating the service module. Integrating these functions into UI components happens in subsequent tasks.
- More sophisticated error handling (e.g., user notifications) can be added later.
- Ensure the backend server's port and base path match the Axios configuration.
