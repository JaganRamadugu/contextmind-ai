import sys
from pathlib import Path

# Ensure backend directory is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.memory import (
    create_conversation,
    save_message,
    get_conversation_history,
    create_indexes
)


if __name__ == "__main__":

    # Create database indexes
    create_indexes()

    # Create a new conversation
    conversation_id = create_conversation()

    print("\nConversation created!")
    print("Conversation ID:", conversation_id)

    # Save first conversation turn
    save_message(
        conversation_id,
        "user",
        "My name is Jagan."
    )

    save_message(
        conversation_id,
        "model",
        "Nice to meet you, Jagan!"
    )

    # Save second conversation turn
    save_message(
        conversation_id,
        "user",
        "I am learning Generative AI."
    )

    save_message(
        conversation_id,
        "model",
        "That's exciting! Generative AI is a fascinating field."
    )

    # Retrieve conversation history
    history = get_conversation_history(conversation_id)

    print("\nRetrieved Conversation History:")
    for msg in history:
        print(f"[{msg['role']}]: {msg['content']}")
