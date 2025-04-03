# Project Features

This document outlines the core features implemented in the A-UI project.

## Orchestrator (`orchestrator.ts`)

The central coordination module managing interactions between all other components.

- **Initialization**: Sets up data directories, initializes dependent components (VectorDB, Embedding Generator, Code Chunker, LLM Providers, etc.).
- **Conversation Management**: Creates, loads, and saves conversation states.
- **Message Processing**: Handles user messages, gathers context (code, knowledge, CI/CD status, command history), constructs prompts, and interacts with LLM providers.
- **Context Gathering**: Uses vector search and other methods to find relevant code chunks and knowledge items.
- **Tool Management**: Registers, parses, and executes tools (e.g., code search, file operations, terminal commands, knowledge query).
- **Task Management**: Creates, tracks, and updates background tasks.
- **Event Handling**: Emits and listens to events from components like CI/CD tracker and task manager for notifications.
- **LLM Interaction**: Selects appropriate LLM (local/external), handles token counting and context window limits, processes responses including streaming and tool calls.

## CI/CD Tracker (`cicd.ts`)

Tracks CI/CD pipelines, deployments, and quality metrics from various providers.

- **Provider Management**: Adds, removes, and configures CI providers (GitHub Actions, Jenkins, GitLab CI, Azure DevOps, etc.).
- **Pipeline Tracking**: Fetches and updates the status of CI pipelines, stages, and jobs.
- **Deployment Tracking**: Fetches and updates the status of deployment environments and services.
- **Quality Metrics**: Integrates with tools like SonarQube to fetch code quality metrics (bugs, vulnerabilities, coverage, etc.).
- **Data Persistence**: Loads and saves CI/CD data locally.
- **Refresh Mechanism**: Periodically refreshes data from providers.
- **Notifications**: Emits events on status changes (pipeline completion, deployment success/failure, quality gate changes).

## Prompt Manager (`pm.ts`)

Handles the construction of prompts for LLMs, manages context, and respects token limits.

- **System Prompt Management**: Allows setting and using a system prompt.
- **Conversation Creation**: Initializes new conversation structures.
- **Prompt Construction**: Combines system prompt, conversation history, user query, and various context items (code, knowledge, CI status, tickets, command history) into a structured prompt.
- **Token Management**: Counts tokens and truncates message history and context intelligently to fit within the LLM's context window, prioritizing recent messages and critical context.
- **Context Formatting**: Formats different types of context (code chunks, knowledge items, etc.) clearly within the prompt.

## AI Integration (`ai.ts`)

Provides interfaces and implementations for interacting with different Large Language Models (LLMs).

- **Provider Interface (`LLMProvider`)**: Defines a standard interface for interacting with LLMs (initialization, response generation, token counting).
- **Ollama Provider**: Implementation for interacting with locally running Ollama models. Handles model checking, pulling models, standard and streaming requests, and token counting via API.
- **ONNX Provider** (Partially Implemented): Intended for running ONNX models locally. Includes logic for starting a server process, managing the process lifecycle, and interacting via API.
- **LLM Factory**: A factory pattern to create instances of different LLM providers based on configuration.
- **Request Options**: Supports configuring temperature, max tokens, stop sequences, and streaming for LLM requests.
- **Error Handling**: Basic error handling for LLM API interactions.

## Code Chunker (`code-chunker/code-chunker.ts`)

Parses source code files and breaks them down into semantic chunks.

- **Language Support**: Uses `tree-sitter` to parse different programming languages (TypeScript, JavaScript, Python initially).
- **Initialization**: Loads `tree-sitter` language parsers.
- **File Chunking**: Reads a file and identifies its language.
- **AST Parsing**: Uses the appropriate parser to build an Abstract Syntax Tree (AST).
- **Chunk Extraction**: Traverses the AST to extract meaningful chunks:
    - File-level chunks
    - Class-level chunks
    - Function/Method-level chunks (including arrow functions)
- **Metadata Extraction**: Gathers metadata for each chunk:
    - File path, start/end lines
    - Language
    - Name (class name, function name)
    - Documentation comments (e.g., JSDoc, docstrings)
    - Imports (using regex - basic)
    - Complexity (simplified cyclomatic complexity calculation)
- **Unique IDs**: Generates unique IDs for each chunk.
- **Fallback**: Creates a basic file-level chunk if the language is unsupported or parsing fails.

## Jira Integration (`jira/`)

Provides services and tools for interacting with Jira.

- **Jira Service (`jira/service.ts`)**: Handles communication with the Jira REST API.
    - Authentication (Basic Auth with API Token)
    - Core API request wrapper (`request`)
    - Fetching issues (`getIssue`, `searchIssues`, `getAssignedIssues`, `getIssuesByType`)
    - Fetching projects (`getProjects`)
    - Fetching issue types (`getIssueTypes`)
    - Basic logging of API responses (`writeLogs`)
- **Jira Parser (`jira/parser.ts`)**: Utility functions to extract Jira keys from URLs.
    - `extractIssueKeyFromUrl`
    - `extractProjectKeyFromUrl`
- **Jira Types (`jira/types.ts`)**: Defines TypeScript interfaces for Jira API responses (Issues, Projects, Search results, Users, etc.).
- **Jira MCP Server (`jira/server.ts`)** (Potentially for a separate microservice/integration):
    - Sets up an MCP (Model Context Protocol) server.
    - Exposes Jira functionalities as tools callable via MCP (e.g., `get_issue`, `get_assigned_issues`).
    - Uses `zod` for defining tool schemas.
    - Can connect via SSE (Server-Sent Events) transport.

## Other Components

- **Embedding Generator (`code-chunker/embedding-gen.ts`)**: Generates vector embeddings for code chunks and knowledge items (using a specified embedding model). Includes caching.
- **Command History Analyzer (`code-chunker/command-history.ts`)**: Analyzes shell command history to identify patterns and suggest automations.
- **Types (`types.ts`, `shared/types/`)**: Shared TypeScript type definitions used across the project.
- **Designs (`designs/`)**: Likely contains UI/UX design files or mockups.
- **Architecture (`arch/`)**: Likely contains architecture diagrams or documentation. 