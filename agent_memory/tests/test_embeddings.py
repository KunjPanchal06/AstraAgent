from embeddings.embedding_model import create_embedding


text = "Research quantum computing security"


vector = create_embedding(text)


print("Vector:")
print(vector)

print("\nVector length:")
print(len(vector))