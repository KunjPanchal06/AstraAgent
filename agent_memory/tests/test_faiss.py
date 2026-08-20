from database.faiss_index.faiss_store import FAISSStore
from embeddings.embedding_model import create_embedding
from memory.episodic import EpisodicMemory


store = FAISSStore(384)


memory_1 = EpisodicMemory(
    task="Research quantum computing security",
    summary="Quantum computers may threaten current encryption methods.",
    tools_used=["web_search", "wikipedia"],
    result="Research completed successfully."
)


memory_2 = EpisodicMemory(
    task="Research Tesla AI strategy",
    summary="Tesla focuses on autonomous driving and AI-based vehicle technology.",
    tools_used=["web_search"],
    result="Research completed successfully."
)


memory_3 = EpisodicMemory(
    task="Research cybersecurity threats",
    summary="Cybersecurity threats include phishing, malware and ransomware.",
    tools_used=["web_search"],
    result="Research completed successfully."
)
for memory in [memory_1, memory_2, memory_3]:

    vector = create_embedding(memory.summary)

    store.add_vector(vector, memory)

query = "How can quantum computers break encryption?"

query_vector = create_embedding(query)


distances, results = store.search(
    query_vector,
    k=2
)


print("Retrieved Memories:\n")


for memory in results:

    print(memory)
    print()