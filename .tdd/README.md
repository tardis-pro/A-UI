# Test Driven Development (TDD) Tracker

This directory tracks the status of unit tests for functions and methods across the A-UI codebase.

## Legend

- ✅: Test implemented and passing.
- ❌: Test not yet implemented or failing.
- N/A: Not applicable (e.g., private helper, interface, type, enum).

## `orchestrator.ts` (AgentOrchestrator)

| Method                     | Test Status |
|----------------------------|-------------|
| `constructor`              | ❌           |
| `initialize`               | ❌           |
| `initializeComponents`     | ❌           |
| `registerEventListeners`   | N/A         |
| `registerDefaultTools`     | N/A         |
| `startConversation`        | ❌           |
| `getActiveConversation`    | ❌           |
| `processUserMessage`       | ❌           |
| `approveToolCall`          | ❌           |
| `executeToolCall`          | ❌           |
| `parseResponseForToolCalls`| ❌           |
| `countTokens`              | ❌           |
| `gatherContext`            | ❌           |
| `searchCode`               | ❌           |
| `searchKnowledge`          | ❌           |
| `handleCodeSearchTool`     | ❌           |
| `handleFileReadTool`       | ❌           |
| `handleFileWriteTool`      | ❌           |
| `handleTerminalExecuteTool`| ❌           |
| `handleKnowledgeQueryTool` | ❌           |
| `handleCICDStatusTool`     | ❌           |
| `loadActiveConversation`   | ❌           |
| `saveActiveConversation`   | ❌           |
| `createTask`               | ❌           |
| `getTasks`                 | ❌           |
| `getTask`                  | ❌           |
| `updateTask`               | ❌           |
| `completeTask`             | ❌           |
| `cancelTask`               | ❌           |
| `registerTool`             | ❌           |
| `dispose`                  | ❌           |

## `cicd.ts` (CICDTracker)

| Method                         | Test Status |
|--------------------------------|-------------|
| `constructor`                  | ❌           |
| `initialize`                   | ❌           |
| `addProvider`                  | ❌           |
| `removeProvider`               | ❌           |
| `getPipelines`                 | ❌           |
| `getPipeline`                  | ❌           |
| `getPipelinesByProvider`       | ❌           |
| `getEnvironments`              | ❌           |
| `getEnvironment`               | ❌           |
| `getEnvironmentsByType`        | ❌           |
| `getQualityMetrics`            | ❌           |
| `getQualityMetricsForProject`  | ❌           |
| `getAggregatedQualityMetrics`  | ❌           |
| `updatePipeline`               | ❌           |
| `updateEnvironment`            | ❌           |
| `updateQualityMetrics`         | ❌           |
| `startRefreshTimer`            | ❌           |
| `stopRefreshTimer`             | ❌           |
| `refreshData`                  | ❌           |
| `refreshGitHubActions`         | ❌           |
| `refreshJenkins`               | ❌           |
| `fetchJenkinsJob`              | ❌           |
| `refreshGitLabCI`              | ❌           |
| `refreshAzureDevOps`           | ❌           |
| `refreshQualityMetrics`        | ❌           |
| `configureSonarIntegration`    | ❌           |
| `configureEnvironment`         | ❌           |
| `loadData`                     | ❌           |
| `saveData`                     | ❌           |
| `saveProviderConfig`           | ❌           |
| `loadProviderConfig`           | ❌           |
| `removeProviderConfig`         | ❌           |
| `dispose`                      | ❌           |
| `CIPipeline` (Interface)       | N/A         |
| `CIStage` (Interface)          | N/A         |
| `CIJob` (Interface)            | N/A         |
| `CIStatus` (Enum)              | N/A         |
| `CIProvider` (Enum)            | N/A         |
| `DeploymentEnvironment` (Int.) | N/A         |
| `DeploymentService` (Int.)     | N/A         |
| `EnvironmentType` (Enum)       | N/A         |
| `DeploymentStatus` (Enum)      | N/A         |
| `QualityMetrics` (Interface)   | N/A         |
| `CICDTrackerOptions` (Int.)    | N/A         |

## `pm.ts` (PromptManager)

| Method                   | Test Status |
|--------------------------|-------------|
| `constructor`            | ❌           |
| `setSystemPrompt`        | ❌           |
| `setMaxContextTokens`    | ❌           |
| `createConversation`     | ❌           |
| `constructPrompt`        | ❌           |
| `truncateMessages`       | ❌           |
| `createContextMessage`   | ❌           |
| `truncateContextMessage` | ❌           |
| `calculateTotalTokens`   | ❌           |
| `getDefaultSystemPrompt` | ❌           |
| `PromptContext` (Int.)   | N/A         |
| `CIStatus` (Interface)   | N/A         |
| `Ticket` (Interface)     | N/A         |

## `ai.ts`

| Class/Interface/Function   | Method/Property       | Test Status |
|--------------------------|-----------------------|-------------|
| `LLMProvider` (Int.)     | *Interface*           | N/A         |
| `LLMRequestOptions` (Int.) | *Interface*           | N/A         |
| `LLMResponse` (Int.)     | *Interface*           | N/A         |
| `OllamaProvider`         | `constructor`         | ❌           |
| `OllamaProvider`         | `initialize`          | ❌           |
| `OllamaProvider`         | `generateResponse`    | ❌           |
| `OllamaProvider`         | `countTokens`         | ❌           |
| `OllamaProvider`         | `isInitialized`       | ❌           |
| `OllamaProvider`         | `standardRequest`     | ❌           |
| `OllamaProvider`         | `streamingRequest`    | ❌           |
| `OllamaProvider`         | `convertRole`         | ❌           |
| `OllamaProvider`         | `pullModel`           | ❌           |
| `ONNXProvider`           | `constructor`         | ❌           |
| `ONNXProvider`           | `initialize`          | ❌           |
| `ONNXProvider`           | `generateResponse`    | ❌           |
| `ONNXProvider`           | `countTokens`         | ❌           |
| `ONNXProvider`           | `isInitialized`       | ❌           |
| `ONNXProvider`           | `shutdown`            | ❌           |
| `ONNXProvider`           | `standardRequest`     | ❌           |
| `ONNXProvider`           | `streamingRequest`    | ❌           |
| `ONNXProvider`           | `startServer`         | ❌           |
| `ONNXProvider`           | `waitForServer`       | ❌           |
| `ONNXProvider`           | `convertRole`         | ❌           |
| `LLMProviderFactory`     | `create`              | ❌           |
| `generateONNXServerScript`| *Function*          | ❌           |

## `code-chunker/code-chunker.ts` (CodeChunker)

| Method                  | Test Status |
|-------------------------|-------------|
| `constructor`           | ❌           |
| `initialize`            | ❌           |
| `chunkFile`             | ❌           |
| `parseNode`             | ❌           |
| `createFileChunk`       | ❌           |
| `createClassChunk`      | ❌           |
| `createFunctionChunk`   | ❌           |
| `extractDocComment`     | ❌           |
| `calculateComplexity`   | ❌           |
| `extractImports`        | ❌           |
| `detectLanguage`        | ❌           |

## `jira/service.ts` (JiraService)

| Method               | Test Status |
|----------------------|-------------|
| `constructor`        | ❌           |
| `request`            | ❌           |
| `getIssue`           | ❌           |
| `searchIssues`       | ❌           |
| `getAssignedIssues`  | ❌           |
| `getIssuesByType`    | ❌           |
| `getProjects`        | ❌           |
| `getIssueTypes`      | ❌           |
| `writeLogs` (Func)   | ❌           |

## `jira/parser.ts`

| Function                 | Test Status |
|--------------------------|-------------|
| `extractIssueKeyFromUrl` | ❌           |
| `extractProjectKeyFromUrl`| ❌           |

## `jira/server.ts` (JiraMcpServer)

| Method            | Test Status |
|-------------------|-------------|
| `constructor`     | ❌           |
| `registerTools`   | N/A         |
| `connect`         | ❌           |
| `startHttpServer` | ❌           |

## `jira/types.ts`

| Interface/Type           | Test Status |
|--------------------------|-------------|
| `JiraError`              | N/A         |
| `JiraIssue`              | N/A         |
| `JiraSearchParams`       | N/A         |
| `JiraSearchResponse`     | N/A         |
| `JiraUser`               | N/A         |
| `JiraProject`            | N/A         |
| `JiraProjectListResponse`| N/A         |
| `JiraIssueTypeResponse`  | N/A         | 