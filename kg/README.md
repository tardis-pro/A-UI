# Knowledge Graph System

A powerful and flexible knowledge graph system built with Python, designed to store, organize, and retrieve various types of information including documents, code repositories, concepts, and their relationships.

## Overview

This system provides a rich set of data structures and utilities for building and managing knowledge graphs, with special emphasis on:
- Document management
- Code repository analysis
- Concept mapping
- Temporal context tracking
- Memory management

## Core Components

### Entity Types

1. **Base Types**
   - `KnowledgeType`: Base categorization for knowledge elements
   - `Entity`: Core knowledge unit with temporal and provenance information
   - `Relationship`: Explicit connections between entities

2. **Content Types**
   - `Document`: Represents various content formats (text, PDF, code, etc.)
   - `Chunk`: Segments of documents forming cohesive units
   - `Concept`: Abstract ideas or notions extracted from content

3. **Code-Specific Types**
   - `CodeRepository`: Represents code repositories (e.g., GitHub)
   - `CodeFile`: Individual files within repositories
   - `CodeSymbol`: Programming symbols (functions, classes, variables)

4. **Context and Memory**
   - `Memory`: Higher-level constructs combining knowledge elements
   - `TemporalContext`: Time-based context for knowledge retrieval
   - `UserInteraction`: Records of user interactions

## Features

- **Rich Metadata**: Each entity type includes comprehensive metadata fields
- **Temporal Tracking**: Built-in support for temporal information and history
- **Flexible Content Handling**: Supports various content types (text, PDF, code, media)
- **Semantic Search**: Integration with semantic search capabilities
- **Validation**: Built-in validation for data integrity (including datetime handling)

## Data Validation

The system includes robust validation mechanisms:
- Datetime validation for temporal fields
- Content type validation
- Relationship integrity checks

## Usage Example

```python
# Adding a document to the knowledge graph
doc = await KnowledgeGraph.add_document(
    file_path="example.pdf",
    content_type=ContentType.PDF
)

# Adding a code repository
repo = await KnowledgeGraph.add_repository(
    repo_url="https://github.com/username/repo"
)

# Creating a memory from entities
memory = await KnowledgeGraph.create_memory(
    title="Project Documentation",
    description="Key concepts from the project",
    entities=[doc, repo]
)

# Searching the knowledge graph
results = await KnowledgeGraph.search_knowledge(
    query="project architecture",
    search_type=SearchType.INSIGHTS
)
```

## Dependencies

- Python 3.7+
- Pydantic for data validation
- Cognee for knowledge processing
- AsyncIO for asynchronous operations

## Best Practices

1. Always use async/await with the provided utility functions
2. Properly handle datetime inputs using ISO format
3. Maintain proper relationship links between entities
4. Use appropriate content types for different kinds of data

## Error Handling

The system includes comprehensive error handling for:
- Invalid datetime inputs
- File processing errors
- Repository access issues
- Search query validation

## Future Enhancements

- Enhanced semantic search capabilities
- Additional content type support
- Improved memory management algorithms
- Extended code analysis features

## Contributing

Contributions are welcome! Please ensure you follow the existing code structure and include appropriate tests for new features. 