import dspy

class CodeEmbeddingGenerator:
    def __init__(self, model_name="sentence-transformers/all-mpnet-base-v2"):
        self.embedder = dspy.Embedder(model_name=model_name)

    def generate_embedding(self, code_string):
        """
        Generates an embedding for a given code string using DSPy.
        """
        embedding = self.embedder(code_string)
        return embedding

if __name__ == '__main__':
    test_code = """
    def hello_world():
        print("Hello, world!")
    """
    embedding_generator = CodeEmbeddingGenerator()
    embedding = embedding_generator.generate_embedding(test_code)
    print(embedding.shape)