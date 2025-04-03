# A-UI End-to-End (E2E) Test Plan

**Goal:** Verify that the A-UI system correctly processes user requests, gathers appropriate context, interacts with the LLM, manages tools, and provides accurate and useful responses/actions, following TDD principles.

**Target Components:** Orchestrator, Prompt Manager, AI Integration (LLM), Code Chunker, Embedding Generator, Vector DB, Knowledge Manager, Tool Registry, CI/CD Tracker, Task Manager.

**Key E2E Scenarios:**

1.  **Basic Conversation Flow:**
    *   **Test:** User sends a simple query (e.g., "hello").
    *   **Expected:** Orchestrator initializes conversation, Prompt Manager creates a basic prompt, LLM generates a greeting response, Orchestrator returns the response. No complex context gathering or tool use.

2.  **Code Analysis Request:**
    *   **Test:** User asks a question about a specific part of the codebase (e.g., "Explain the `initialize` method in `AgentOrchestrator`").
    *   **Expected:** Orchestrator identifies the need for code context. Code Chunker/Embedding Generator/Vector DB are used to find relevant code chunks for `AgentOrchestrator.initialize`. Prompt Manager includes these chunks in the prompt. LLM generates an explanation based on the code. Orchestrator returns the explanation.

3.  **Code Search Tool Usage:**
    *   **Test:** User explicitly asks to search for code (e.g., "Find functions related to 'token counting'").
    *   **Expected:** Orchestrator processes the message. LLM identifies the need for the `code_search` tool. Orchestrator emits `tool:needsApproval` (or executes directly if configured). User approves (simulated). Orchestrator executes the `code_search` tool via the Tool Registry (using Embedding Generator/Vector DB). Tool result (code chunks) is added to the conversation. LLM potentially summarizes or uses the results in a follow-up response.

4.  **File Read/Write Tool Usage:**
    *   **Test:** User asks to read a specific file, then asks to modify it (e.g., "Read `DESIGN-GUIDE.md`", then "Add a section about Testing Strategy").
    *   **Expected:** First message triggers `file_read` tool via LLM. User approves. File content is returned. Second message triggers `file_write` tool via LLM. User approves. Orchestrator executes the write operation. A success message is returned. (Verify file content changes).

5.  **Knowledge Query Tool Usage:**
    *   **Test:** User asks a question expected to be in the knowledge base (assuming some knowledge items exist) (e.g., "What's the project's coding style?").
    *   **Expected:** Orchestrator gathers context, potentially using `knowledge_query` tool directly or via LLM identifying the need. User approves. Knowledge Manager/Vector DB retrieves relevant items. LLM synthesizes an answer based on knowledge items. Orchestrator returns the answer.

6.  **CI/CD Status Request:**
    *   **Test:** User asks about the build status (e.g., "What's the status of the main build pipeline?").
    *   **Expected:** Orchestrator gathers context, potentially using `cicd_status` tool directly or via LLM. User approves. CI/CD Tracker provides the status. LLM formats the information. Orchestrator returns the status update.

7.  **Context Window Management:**
    *   **Test:** Engage in a long conversation exceeding the token limit, then ask a question referencing earlier parts.
    *   **Expected:** Prompt Manager truncates the history/context correctly. LLM response might indicate missing context or still answer correctly based on retained information (verify prioritization logic - e.g., system prompt, recent messages, relevant context are kept).

8.  **Error Handling (Tool Failure):**
    *   **Test:** Trigger a tool call that is designed to fail (e.g., read a non-existent file).
    *   **Expected:** Tool execution fails. Orchestrator records the error in the tool result. LLM is informed (potentially via a system message or directly in the next prompt) and generates an appropriate error message to the user.

9.  **Task Management (Basic):**
    *   **Test:** User requests a background task (if a relevant tool exists, e.g., "Refactor all `any` types in `orchestrator.ts`").
    *   **Expected:** LLM identifies the need for a task. Orchestrator creates a task via Task Manager. User is notified that the task has started. (Further tests would involve checking task progress/completion events).

10. **Multi-Context Request:**
    *   **Test:** Ask a question requiring multiple context types (e.g., "Based on the recent 'login feature' ticket and the `auth.ts` code, suggest how to implement the logout functionality").
    *   **Expected:** Orchestrator gathers code context (`auth.ts`), potentially Jira ticket context (if integrated), and potentially knowledge context. Prompt Manager combines these. LLM generates a relevant suggestion. Orchestrator returns the response.

**Testing Infrastructure Considerations:**

*   **Mocking:** Mock LLM responses, external APIs (Jira, GitHub, CI providers), and potentially file system operations/terminal execution for controlled testing.
*   **Data Seeding:** Pre-populate the Vector DB with known code chunks and knowledge items for predictable search results.
*   **Configuration:** Use test-specific configurations (e.g., smaller token limits, specific models).
*   **Assertions:** Assert on the final user-facing response, intermediate tool calls/results, conversation state, and side effects (e.g., file changes, task creation). 