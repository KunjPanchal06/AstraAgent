from memory.short_term import *


state = create_initial_state()


state = add_message(
    state,
    "Research Tesla AI strategy"
)


state = update_task(
    state,
    "Tesla AI Research"
)


state = update_status(
    state,
    "planning"
)


print("Messages:")
print(get_messages(state))


print("\nFull Memory:")
print(state)