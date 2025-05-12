import tokenize
import io

def tokenize_code(code_string):
    """
    Tokenizes a given code string into a list of tokens.
    """
    tokens = []
    try:
        string_io = io.StringIO(code_string)
        for token in tokenize.generate_tokens(string_io.readline):
            tokens.append(token.string)
    except tokenize.TokenError as e:
        print(f"Error tokenizing code: {e}")
        return []
    return tokens

if __name__ == '__main__':
    test_code = """
    def hello_world():
        print("Hello, world!")
    """
    tokens = tokenize_code(test_code)
    print(tokens)