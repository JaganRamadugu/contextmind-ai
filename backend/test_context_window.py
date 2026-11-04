import sys
from pathlib import Path

# Ensure backend directory is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.memory import (
    create_conversation,
    save_message,
    get_conversation_history
)

conversation_id = create_conversation()

# Insert 15 messages
for i in range(1, 16):
    role = "user" if i % 2 != 0 else "model"
    save_message(
        conversation_id,
        role,
        f"This is message number {i}"
    )

# Retrieve only the latest 10 messages
history = get_conversation_history(
    conversation_id,
    limit=10
)

print("\nRetrieved Messages:\n")
for message in history:
    print(message["role"], ":", message["content"])

print("\nTotal retrieved:", len(history))
