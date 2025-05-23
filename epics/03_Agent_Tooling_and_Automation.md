# Epic 3: Agent Tooling and Automation Capabilities

## Description

This epic transforms agents from passive discussants into active participants capable of interacting with external systems and performing automated tasks. It involves equipping agents with the ability to use "tools" – predefined functions or API calls – to achieve specific goals. This could range from simple actions like fetching current data from an API (e.g., stock prices, weather) to complex operations like interacting with code repositories (reading files, suggesting changes), executing code snippets in a sandboxed environment, calling specialized APIs (like the available Maps tools), creating or updating JIRA tickets, or even generating draft documents (PRDs, test plans). The core is implementing a robust function calling mechanism (compatible with models like OpenAI's function calling, Gemini's tool use, or open-source equivalents like Gorilla LLM) within the agent's reasoning loop.

## User Stories

- **As an Agent,** I want to identify when a task requires external action or information beyond my internal knowledge and the provided context, select the appropriate tool, formulate the correct input parameters, and call the tool, so I can fulfill requests or contribute more effectively (e.g., "Fetch the latest status of JIRA-123", "Generate Python code for a function to calculate Fibonacci numbers", "Find cafes near 12.93,77.61").
- **As a Developer defining an Agent's Persona,** I want to easily define and register available tools (functions, API calls) with clear descriptions, parameters, and expected outputs, so agents can understand when and how to use them.
- **As a Discussion Participant,** I want to see a clear indication when an agent is using a tool and what the outcome was (success, failure, data retrieved), so I can understand the agent's actions and trust its outputs.
- **As a System Administrator,** I want control over which tools specific agents or agent types are allowed to use, and implement safety measures (like sandboxing for code execution or rate limiting for external APIs), so I can ensure security and manage costs.

## Potential Pitfalls

- **Tool Selection Ambiguity:** The LLM might struggle to choose the correct tool among several similar options or fail to recognize when a tool is needed.
- **Parameter Hallucination:** The LLM might generate incorrect or nonsensical parameters for the tool call.
- **Error Handling for Tool Execution:** Tools can fail for various reasons (API downtime, invalid input, permission errors, code execution errors). The agent needs robust mechanisms to handle these failures and potentially retry or report the issue.
- **Security Risks:** Allowing agents to execute code or interact with external systems inherently introduces security risks. Requires careful sandboxing, input validation, and permission management.
- **Tool Definition Brittleness:** Poorly defined tool descriptions or parameters can confuse the LLM. Tool schemas need to be clear and robust.
- **Latency:** Tool execution (especially code execution or complex API calls) can add significant latency to the agent's response time.
- **Cost Management:** Frequent use of external APIs or computationally intensive tools can lead to unexpected costs.

## Good Practices

- **Clear Tool Definitions:** Use a structured format (like JSON Schema) to define tools, including clear descriptions of functionality, parameters (with types and descriptions), and expected return values. Provide examples if possible.
- **Few-Shot Prompting for Tool Use:** Include examples of correct tool usage (thought process, tool selection, parameter generation) in the agent's base prompt to guide the LLM.
- **Input Validation:** Rigorously validate parameters generated by the LLM before passing them to the actual tool execution logic.
- **Sandboxing:** Execute potentially risky tools (like code execution) in isolated, secure environments (e.g., Docker containers, WebAssembly runtimes) with strict resource limits.
- **Error Handling and Retries:** Implement strategies for handling tool failures, potentially including retries with backoff, or prompting the LLM to try a different approach.
- **Tool Orchestration Framework:** Use libraries or frameworks designed for LLM tool use (e.g., LangChain agents, LlamaIndex tools, Haystack agents) to simplify implementation and benefit from built-in error handling and reasoning loops.
- **User Feedback Loop:** Provide mechanisms for users to give feedback on incorrect or problematic tool usage to help fine-tune the system.
- **Monitoring and Rate Limiting:** Monitor tool usage frequency and success/failure rates. Implement rate limiting for costly or sensitive tools.
- **Multi-turn Tool Use:** Design the system to handle scenarios where multiple tool calls might be needed to accomplish a single task.

## Definition of Done (DoD)

- Agent architecture supports invoking external functions/tools based on LLM decisions.
- At least two distinct tools are implemented and integrated (e.g., a simple API call like fetching weather, and a more complex one like semantic code search via the Knowledge Graph API from Epic 2).
- Agents can successfully select and call the implemented tools with correctly formatted parameters in relevant scenarios (demonstrated via integration tests).
- Tool execution failures are handled gracefully (e.g., agent reports the failure or tries an alternative).
- Tool definitions are documented clearly.
- Basic security measures are in place for the implemented tools (e.g., input validation, API key management if applicable).
- Frontend UI indicates when an agent is using a tool and displays the result (or failure).

## End-to-End (E2E) Flows

1.  **Agent Uses a Knowledge Search Tool:**
    - Discussion progresses, agent identifies a need for specific information not in the immediate context.
    - LLM reasoning process (prompt includes tool definitions) determines the `knowledge_search` tool is appropriate.
    - LLM generates the required parameters (e.g., `query: "details on auth bug JIRA-456"`, `filter: {source: 'jira'}`).
    - Agent framework intercepts the tool call request.
    - Framework validates parameters against the tool's schema.
    - Framework executes the tool: Calls the Knowledge Search API (`POST /api/v1/knowledge/search`).
    - Knowledge Search API returns results (or an error).
    - Framework passes the results (or error message) back to the LLM as tool output.
    - LLM incorporates the tool output into its next reasoning step and generates the final response.
    - Agent sends the final response (potentially mentioning the search results) to the Discussion Service.

2.  **Agent Uses a Code Execution Tool (Simplified):**
    - Agent is asked to "calculate the sum of squares for numbers 1 to 5".
    - LLM reasoning identifies the need for computation and selects the `python_interpreter` tool.
    - LLM generates parameters: `code: "sum([x*x for x in range(1, 6)])"`.
    - Agent framework intercepts the tool call.
    - Framework validates parameters.
    - Framework sends the code to a sandboxed Python execution environment (e.g., a secure API endpoint or container).
    - Sandbox executes the code and captures the result (`stdout`/`stderr` or return value).
    - Sandbox returns the result (e.g., `"55"`) or error information to the framework.
    - Framework passes the result/error back to the LLM.
    - LLM generates the final response: "The sum of squares for numbers 1 to 5 is 55."
    - Agent sends the response to the Discussion Service. 