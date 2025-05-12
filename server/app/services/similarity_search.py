import numpy as np
from numpy.linalg import norm
import numpy as np
from numpy.linalg import norm
from tree_sitter import Parser, Language
from server.app.services.code_embedding_generator import CodeEmbeddingGenerator

def cosine_similarity(a, b):
    """
    Calculates the cosine similarity between two vectors.
    """
    return np.dot(a, b) / (norm(a) * norm(b))

from server.app.services.knowledge import KnowledgeService
from server.app.dependencies import get_db, get_vector_store

async def find_similar_codes(query, code_chunks, top_n=5):
    """
    Finds the top_n most similar code chunks to the query using cosine similarity of embeddings,
    after refining the query using semantic search.
    """
    db = next(get_db())
    vector_store = get_vector_store()
    knowledge_service = KnowledgeService(db, vector_store)

    # Refine the query using semantic search
    knowledge_items = await knowledge_service.search_knowledge(query, limit=3)
    refined_query = query
    if knowledge_items:
        # Combine the content of the knowledge items to refine the query
        refined_query = query + " ".join([item.content for item in knowledge_items])

    embedding_generator = CodeEmbeddingGenerator()
    query_embedding = embedding_generator.generate_embedding(refined_query)

    similarities = []
    for chunk in code_chunks:
        chunk_embedding = embedding_generator.generate_embedding(chunk.content)
        similarity = cosine_similarity(query_embedding, chunk_embedding)
        similarities.append(similarity)

    # Get the indices of the top_n most similar codes
    top_indices = np.argsort(similarities)[::-1][:top_n]
    return top_indices, np.array(similarities)[top_indices]

if __name__ == '__main__':
    # Example usage
    code_chunks = [
        type('obj', (object,), {'content': "def foo(): print('foo')"})(),
        type('obj', (object,), {'content': "def bar(): print('bar')"})(),
        type('obj', (object,), {'content': "def baz(): print('baz')"})(),
    ]
    query = "function that prints something"
    top_indices, similarities = find_similar_codes(query, code_chunks)
    print(f"Top indices: {top_indices}")
    print(f"Similarities: {similarities}")