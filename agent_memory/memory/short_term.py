from typing import TypedDict, List


class AgentState(TypedDict):

    messages: List[str]

    current_task: str

    agent_status: str



def create_initial_state():

    return AgentState(
        messages=[],
        current_task="",
        agent_status="idle"
    )



def add_message(state, message):

    state["messages"].append(message)

    return state



def get_messages(state):

    return state["messages"]



def update_task(state, task):

    state["current_task"] = task

    return state



def update_status(state, status):

    state["agent_status"] = status

    return state