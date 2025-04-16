flowchart TD
    subgraph "Desktop Application"
        UI[User Interface]
        Chat[Chat Interface]
        Search[Code Search]
        Terminal[Embedded Terminal]
        Dashboard[Dashboard]
        APIClient[API Client SDK]
    end

    subgraph "Agent Orchestrator Core"
        AOC[Agent Orchestrator]
        ContextMgr[Context Manager]
        ToolInvoker[Tool Invoker]
        StateMgr[State Manager]
    end
    
    subgraph "Knowledge Processing Layer"
        CodeChunker[Code Chunking]
        EmbeddingGen[Embedding Generation]
        VectorDB[Vector Database]
        KnowledgeCapture[Knowledge Capture]
        KnowledgeClassify[Knowledge Classification]
    end
    
    subgraph "AI Processing Layer"
        LocalLLM[Local LLM]
        ExternalLLM[External LLM]
        PromptMgr[Prompt Manager]
    end
    
    subgraph "Integration Layer"
        CLIMonitor[CLI Monitor]
        GitIntegration[Git Integration]
        JiraIntegration[Jira Integration]
        CIMonitor[CI/CD Monitor]
    end
    
    subgraph "API Backend Layer"
        FastAPI[FastAPI Server]
        AuthService[Auth Service]
        AIService[AI Model Service]
        KTService[Knowledge Service]
        CodeService[Code Processing Service]
        WebSockets[WebSocket Service]
    end
    
    %% Connections
    UI --> APIClient
    Chat --> APIClient
    Search --> APIClient
    Terminal --> APIClient
    Dashboard --> APIClient
    
    APIClient --> FastAPI
    
    FastAPI --> AuthService
    FastAPI --> AIService
    FastAPI --> KTService
    FastAPI --> CodeService
    FastAPI --> WebSockets
    
    AIService --> LocalLLM
    AIService --> ExternalLLM
    KTService --> VectorDB
    KTService --> KnowledgeCapture
    KTService --> KnowledgeClassify
    CodeService --> CodeChunker
    CodeService --> EmbeddingGen
    
    AOC --> ContextMgr
    AOC --> ToolInvoker
    AOC --> StateMgr
    
    ContextMgr --> VectorDB
    ToolInvoker --> CLIMonitor
    ToolInvoker --> GitIntegration
    ToolInvoker --> JiraIntegration
    ToolInvoker --> CIMonitor
    
    CodeChunker --> EmbeddingGen
    EmbeddingGen --> VectorDB
    KnowledgeCapture --> KnowledgeClassify
    KnowledgeClassify --> VectorDB
    
    ContextMgr --> PromptMgr
    PromptMgr --> LocalLLM
    PromptMgr --> ExternalLLM
    LocalLLM --> AOC
    ExternalLLM --> AOC
    
    APIClient --> AOC