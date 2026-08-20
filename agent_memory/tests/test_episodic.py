from memory.episodic import EpisodicMemory


memory = EpisodicMemory(
    task="Research quantum computing security",
    summary="Quantum computers may threaten current encryption methods.",
    tools_used=["web_search", "wikipedia"],
    result="Research completed successfully."
)


print(memory)