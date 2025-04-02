// AUI Application Structure

// Frontend (React + Vite)
// src/renderer
├── components
│   ├── Chat/                  // AI interaction interface
│   │   ├── ChatWindow.tsx     // Main chat component
│   │   ├── MessageItem.tsx    // Individual message display
│   │   └── InputArea.tsx      // User input component
│   │
│   ├── CodeSearch/            // Semantic code search UI
│   │   ├── SearchBar.tsx      // Search input component
│   │   └── ResultsList.tsx    // Display search results
│   │
│   ├── Terminal/              // Embedded terminal components
│   │   ├── TerminalView.tsx   // Terminal display component
│   │   └── CommandHistory.tsx // History and recommendations view
│   │
│   ├── Dashboard/             // Main dashboard components
│   │   ├── DashboardView.tsx  // Primary dashboard layout
│   │   ├── CIStatusPanel.tsx  // CI/CD status display
│   │   ├── KnowledgePanel.tsx // Knowledge base summary
│   │   └── DeploymentPanel.tsx// Deployment status tracking
│   │
│   ├── Onboarding/            // Onboarding wizard components
│   │   ├── OnboardingWizard.tsx // Main wizard component
│   │   └── ConfigurationSteps.tsx // Step-by-step setup guide
│   │
│   └── common/                // Shared UI components
│       ├── Button.tsx         // Custom button component
│       ├── CodeViewer.tsx     // Code display with syntax highlighting
│       ├── Notification.tsx   // Notification system
│       └── DiffViewer.tsx     // Code diff visualization

// Backend (Electron Main Process)
// src/main
├── index.ts                   // Electron main process entry
├── ipc/                       // IPC communication layer
│   ├── handlers.ts            // Main IPC event handlers
│   └── channels.ts            // IPC channel definitions
│
├── orchestrator/              // Agent Orchestrator Core
│   ├── AgentOrchestrator.ts   // Main orchestration logic
│   ├── ContextManager.ts      // Context handling and aggregation
│   ├── ToolInvoker.ts         // Tool execution management
│   └── StateManager.ts        // Conversation state tracking
│
├── knowledge/                 // Knowledge Processing Layer
│   ├── code/                  // Code understanding components
│   │   ├── CodeChunker.ts     // Code chunking mechanisms
│   │   ├── ASTParser.ts       // Abstract Syntax Tree parsing
│   │   └── EmbeddingGenerator.ts // Vector embedding generation
│   │
│   ├── vectordb/             // Vector database integration
│   │   ├── VectorDBClient.ts  // Vector DB client interface
│   │   ├── ChromaAdapter.ts   // Chroma DB implementation
│   │   └── QdrantAdapter.ts   // Qdrant implementation
│   │
│   └── capture/              // Knowledge capture components
│       ├── KnowledgeCapture.ts // Knowledge aggregation
│       ├── KnowledgeClassifier.ts // Classification engine
│       └── KnowledgeStorage.ts // Storage mechanisms
│
├── ai/                        // AI Processing Layer
│   ├── llm/                   // LLM integration components
│   │   ├── LocalLLMClient.ts  // Local LLM interface
│   │   ├── ExternalLLMClient.ts // External LLM interface
│   │   └── LLMFactory.ts      // Factory for LLM selection
│   │
│   └── prompt/                // Prompt engineering components
│       ├── PromptManager.ts   // Prompt construction
│       ├── PromptTemplates.ts // Template definitions
│       └── ResponseParser.ts  // LLM response processing
│
├── integrations/              // Integration Layer
│   ├── cli/                   // CLI integration
│   │   ├── CLIMonitor.ts      // Shell command monitoring
│   │   ├── CommandAnalyzer.ts // Command pattern recognition
│   │   └── TerminalConnector.ts // Terminal communication
│   │
│   ├── vcs/                   // Version control integration
│   │   ├── GitClient.ts       // Git operations interface
│   │   └── GitHubClient.ts    // GitHub API integration
│   │
│   ├── issues/                // Issue tracking integration
│   │   ├── JiraClient.ts      // Jira API integration
│   │   └── IssueParser.ts     // Issue data processing
│   │
│   └── ci/                    // CI/CD integration
│       ├── CIMonitor.ts       // CI pipeline monitoring
│       ├── SonarClient.ts     // SonarCloud/SonarQube integration
│       └── DeploymentTracker.ts // Deployment status tracking
│
└── utils/                     // Utility functions and helpers
    ├── config.ts              // Configuration management
    ├── logger.ts              // Logging system
    ├── security.ts            // Security and privacy utilities
    └── fileSystem.ts          // File system operations

// Shared Types and Constants
// src/shared
├── types/                     // TypeScript type definitions
│   ├── api.ts                 // API interface types
│   ├── knowledge.ts           // Knowledge entity types
│   ├── message.ts             // Chat message types
│   └── tool.ts                // Tool invocation types
│
└── constants/                 // Shared constants
    ├── commands.ts            // Command definitions
    ├── prompts.ts             // Common prompt elements
    └── errors.ts              // Error definitions