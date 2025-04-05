# TASK-01.4: Chat Integration (Code Assistant)

**Status:** 🔴 Not Started
**Priority:** P0: Critical
**Parent Epic:** [EPIC-01: UI-Backend Integration](EPIC-01-UI-Backend-Integration.md)
**Depends On:** [TASK-01.3: Frontend API Service Module](TASK-01.3-Frontend-API-Service.md)
**Related Feature:** [11-CODE-ASSISTANT.md](../00-FEATURE-LIST.md)
**Assignee:** TBD
**Estimate:** 3-5 hours

## Goal

Integrate the core chat functionality into the frontend UI, likely within the `CodeAssistant` component or a similar chat interface. This involves fetching the conversation history, sending user messages via the API service, and displaying the conversation flow.

## Sub-Tasks

1.  **Identify Chat Component:**
    *   Locate the primary React component responsible for displaying the chat interface (e.g., `app/components/sections/CodeAssistant.tsx` or similar).

2.  **State Management for Conversation:**
    *   Implement state management (e.g., using `useState`, `useReducer`, or a dedicated state management library like Zustand/Redux if already in use) within the chat component or a parent component to hold the current `Conversation` object.
    *   Manage loading states (e.g., while fetching conversation, while waiting for response) and error states.

3.  **Fetch Initial Conversation:**
    *   Use the `useEffect` hook to call the `getConversation()` function from the API service (`app/services/api.ts`) when the component mounts.
    *   Update the component's state with the fetched conversation data.
    *   Handle cases where no conversation exists or an error occurs during fetching.

4.  **Display Conversation Messages:**
    *   Modify the component's render logic to iterate over the `messages` array from the conversation state.
    *   Render each message appropriately based on its `role` (USER, ASSISTANT, SYSTEM - system messages might be hidden or styled differently).
    *   Ensure messages are displayed in chronological order.
    *   Style messages clearly to distinguish between user and assistant.

5.  **Implement Message Input:**
    *   Ensure there's an input field and a send button for the user to type messages.
    *   Manage the input field's state.

6.  **Handle Message Sending:**
    *   Implement the `onSubmit` handler for the message input/form.
    *   When the user sends a message:
        *   Prevent default form submission.
        *   Get the message text from the input state.
        *   Clear the input field.
        *   Optionally, immediately add the user's message to the local conversation state for responsiveness (optimistic update).
        *   Set a loading state (e.g., disable input, show indicator).
        *   Call the `sendChatMessage(message)` function from the API service.
        *   Once the API call returns the assistant's response message:
            *   Add the assistant's message to the conversation state.
            *   Clear the loading state.
        *   Handle potential errors from the API call (e.g., display an error message).

7.  **Refactor Existing Logic:**
    *   Remove any previous mock data or direct `store/` imports related to chat messages within the component.
    *   Ensure all chat data flows through the API service and component state.

8.  **Scrolling Behavior:**
    *   Implement auto-scrolling to keep the latest message visible in the chat window.

9.  **Verification:**
    *   Run the frontend and backend servers concurrently (`npm run dev`).
    *   Verify the chat interface loads and displays any existing conversation history fetched from the backend.
    *   Send a message and verify:
        *   The user message appears in the UI.
        *   A request is sent to `POST /api/chat`.
        *   The assistant's response from the backend appears in the UI.
        *   The conversation state is updated correctly.
    *   Test sending multiple messages.
    *   Verify loading indicators and basic error handling work.

## Definition of Done

- Chat component fetches and displays the conversation history on load.
- User can type and send messages.
- User messages are sent to the backend via the `sendChatMessage` API function.
- Assistant responses received from the backend are displayed in the chat interface.
- Conversation state is managed correctly within the component.
- Loading and basic error states are handled visually.
- Previous mock chat logic is removed.
- Chat window scrolls automatically to the latest message.

## Notes

- This task focuses on the request-response cycle. Implementing streaming responses is a separate enhancement.
- Styling of messages should be functional but doesn't need to be pixel-perfect for this task.
- Handling tool calls within messages is not part of this task.
