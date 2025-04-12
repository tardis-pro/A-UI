✅ AI Integration Knowledge Graph (Structured Schema v1)
🎯 Nodes (Entities)
Each has: type, description, interfaces, security, and relations.

CodeAssistant
Type: Module

Description: Provides code generation, suggestions, and debugging assistance using local (ONNX/Mistral) or optional external LLMs.

Interfaces: pm.ts, ai.ts, code-chunker.ts

Security: Local-first; external calls gated by explicit user consent

Relations:

Uses → VectorDB

Triggered By → Orchestrator

Communicates With → PromptManager

KnowledgeBase
Type: System

Description: Unified store of code, tickets, docs, commands; supports retrieval & inference

Interfaces: embedding-gen.ts, command-history.ts

Security: All local unless external retrieval is configured

Relations:

Fed By → CommandHistoryAnalyzer, CodeChunker

Queried By → PromptManager, CodeAssistant

CommandHistoryAnalyzer
Type: Tool

Description: Extracts patterns from CLI logs to auto-suggest or execute workflows

Interfaces: orchestrator.ts, embedding-gen.ts

Relations:

Feeds → KnowledgeBase

Observed By → Orchestrator

Automates → ShellOps

VectorDB
Type: Storage Layer

Description: Chroma/Qdrant for storing embeddings from code/doc chunks

Relations:

Read By → PromptManager, CodeAssistant

Written By → EmbeddingGenerator, CodeChunker

PromptManager (pm.ts)
Type: Coordination Layer

Description: Assembles prompts using system messages, recent history, and semantic context

Relations:

Sends To → LLMProvider

Pulls From → KnowledgeBase, VectorDB, CI/CD Tracker, Jira Integration

AI Module (ai.ts)
Type: Provider Abstraction

Description: Manages model selection, local/remote execution, token counting, streaming

Interfaces: LLMFactory, PromptManager

Security: Escalation to cloud requires opt-in

Relations:

Instantiates → ONNXProvider, OllamaProvider

Interfaces With → LLMFactory

CI/CD Tracker
Type: Monitor Module

Description: Pulls pipeline data from Jenkins, GitHub Actions, GitLab, etc.

Security: Local fetches; external API keys stored securely

Relations:

Feeds → PromptManager, Dashboard

Pulls From → ExternalAPIs

Jira Integration
Type: API Service

Description: Connects to Jira via REST API, uses Zod schemas and optional MCP server

Relations:

Provides Tools To → LLM

Syncs With → CI/CD Tracker, KnowledgeBase

SecurityModel
Type: Policy System

Description: Manages user permissions, sandboxing, token usage

Relations:

Governs → AI Module, Jira Integration, LLM Escalation

🔗 Edges (Major Relationships)
From	Type	To	Description
CodeAssistant	Uses	VectorDB	Retrieves code embeddings for context
CodeChunker	Writes	VectorDB	Stores parsed semantic units
EmbeddingGenerator	Feeds	VectorDB	Populates with fresh or updated chunks
PromptManager	Queries	KnowledgeBase	Gathers context for LLM
AI Module	Escalates To	External LLMs	Optional cloud-based reasoning
Jira Integration	Syncs With	CI/CD Tracker	Unified ticket/deployment linkage
SecurityModel	Controls	AI Module	Governs access to remote APIs and data sent
Command Analyzer	Adds To	KnowledgeBase	Tacit knowledge via behavior patterns