# A-UI API Documentation

## Base URL
`/api`

## Authentication
All endpoints require JWT authentication unless specified otherwise. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Core API Endpoints

### Health and System
1. **Health Check**
   - `GET /api/health`
   - Returns service health status and basic metrics
   - Response example:
     ```json
     {
       "status": "ok",
       "service": "A-UI API",
       "timestamp": "2024-03-21T10:00:00Z",
       "uptime": 3600
     }
     ```

2. **System Information**
   - `GET /api/system`
   - Returns detailed system metrics
   - Response includes CPU, memory, disk usage, and platform info

3. **Available Routes**
   - `GET /api/routes`
   - Lists all available API routes and their descriptions

### Knowledge Management

1. **Knowledge Items**
   - `POST /api/knowledge/items`
     - Create a new knowledge item
   - `GET /api/knowledge/items/{item_id}`
     - Get a specific knowledge item
   - `PUT /api/knowledge/items/{item_id}`
     - Update a knowledge item
   - `DELETE /api/knowledge/items/{item_id}`
     - Delete a knowledge item

2. **Knowledge Search**
   - `POST /api/knowledge/search`
     - Search through knowledge base
     - Supports semantic search with filters

3. **Knowledge Extraction**
   - `POST /api/knowledge/extract/text`
     - Extract knowledge from text content
   - `POST /api/knowledge/extract/conversation`
     - Extract knowledge from conversation content

4. **Knowledge Relations**
   - `POST /api/knowledge/relations`
     - Create relationships between knowledge items
   - `GET /api/knowledge/entity/{entity_id}`
     - Get knowledge items linked to an entity
   - `POST /api/knowledge/entity-links`
     - Link entities to knowledge items

### Code Processing

1. **Code Analysis**
   - `POST /api/code/chunk`
     - Parse and chunk code files
   - `POST /api/code/search`
     - Semantic code search
   - `GET /api/code/metadata`
     - Extract code metadata

### Real-time Communication

1. **WebSocket Endpoints**
   - `WS /ws/{channel_id}`
     - WebSocket connection for real-time updates
   - `GET /events/{channel_id}`
     - Server-Sent Events (SSE) for status notifications

2. **Progress Tracking**
   - `GET /progress`
     - List all progress tasks
   - `GET /progress/{task_id}`
     - Get specific task progress
   - `PUT /progress/{task_id}`
     - Update task progress

### Documentation
- `GET /docs`
  - Swagger UI documentation
- `GET /redoc`
  - ReDoc documentation
- `GET /metrics`
  - Prometheus metrics endpoint

## Data Structures

### Knowledge Item
```typescript
interface KnowledgeItem {
  id: string;                // Unique identifier
  content: string;           // Actual knowledge content
  type: KnowledgeType;       // Type of knowledge
  source: KnowledgeSource;   // Source information
  tags: string[];           // Classification tags
  timestamp: Date;          // Creation/modification time
  relatedItemIds: string[]; // Related knowledge items
  confidence: number;       // Quality/confidence score (0-1)
  metadata: Record<string, any>; // Additional metadata
}
```

### Code Chunk
```typescript
interface CodeChunk {
  id: string;
  content: string;
  type: CodeChunkType;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  language: string;
  metadata: Record<string, any>;
}
```

## Error Handling

All endpoints follow a standard error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional error details
  }
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse. Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Number of requests allowed per window
- `X-RateLimit-Remaining`: Number of requests remaining in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Versioning

The API uses URL versioning. The current version is v1, included in the base URL:
`/api/v1/...`

## WebSocket Protocol

WebSocket connections follow this protocol:
1. Connect to `/ws/{channel_id}`
2. Send authentication message
3. Receive real-time updates
4. Handle reconnection with exponential backoff

Message format:
```json
{
  "type": "message_type",
  "payload": {},
  "timestamp": "ISO8601_TIMESTAMP"
}
```

## SDK Usage

TypeScript SDK is available for easy integration:

```typescript
const client = new APIClient({
  baseUrl: 'http://your-api-url',
  authToken: 'your-jwt-token'
});

// AI operations
const aiClient = client.ai;
await aiClient.createChatCompletion(messages, options);

// Knowledge operations
const knowledgeClient = client.knowledge;
await knowledgeClient.searchKnowledge(query, options);

// Code operations
const codeClient = client.code;
await codeClient.analyzeCode(codeContent);
``` 