from pydantic import BaseModel
from typing import List

#Pydantic is being used to create a structured and validated data model.
class EpisodicMemory(BaseModel):

    task: str

    summary: str

    tools_used: List[str]

    result: str