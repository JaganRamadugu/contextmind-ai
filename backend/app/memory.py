from datetime import datetime, timezone
from uuid import uuid4
from app.config import MAX_CONTEXT_MESSAGES

from app.database import (
    conversations_collection,
    messages_collection
)


def create_conversation(user_id: str = "default_user", title: str = "New Chat"):
    conversation_id = str(uuid4())

    conversation = {
        "conversation_id": conversation_id,
        "user_id": user_id,
        "title": title,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    conversations_collection.insert_one(conversation)
    return conversation_id


def save_message(conversation_id, role, content, user_id: str = None):
    message = {
        "conversation_id": conversation_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc)
    }

    messages_collection.insert_one(message)

    # Update conversation timestamp
    conversations_collection.update_one(
        {"conversation_id": conversation_id},
        {
            "$set": {
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )


def update_conversation_title(conversation_id: str, title: str, user_id: str = None) -> bool:
    query = {"conversation_id": conversation_id}
    if user_id:
        query["user_id"] = user_id

    result = conversations_collection.update_one(
        query,
        {
            "$set": {
                "title": title,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    return result.modified_count > 0


def get_conversation_history(conversation_id, limit=MAX_CONTEXT_MESSAGES):
    messages = messages_collection.find(
        {"conversation_id": conversation_id}
    ).sort([
        ("timestamp", -1),
        ("_id", -1)
    ]).limit(limit)

    history = []

    for message in messages:
        history.append({
            "role": message["role"],
            "content": message["content"]
        })

    # Restore chronological order
    history.reverse()

    # Ensure history starts with a user message
    while history and history[0]["role"] != "user":
        history.pop(0)

    return history


def create_indexes():
    conversations_collection.create_index(
        "conversation_id",
        unique=True
    )

    conversations_collection.create_index(
        [
            ("user_id", 1),
            ("updated_at", -1)
        ]
    )

    messages_collection.create_index(
        [
            ("conversation_id", 1),
            ("timestamp", 1),
            ("_id", 1)
        ]
    )

    print("MongoDB indexes created successfully!")


def get_all_messages(conversation_id):
    messages = messages_collection.find(
        {"conversation_id": conversation_id}
    ).sort([
        ("timestamp", 1),
        ("_id", 1)
    ])

    history = []

    for message in messages:
        history.append({
            "role": message["role"],
            "content": message["content"],
            "timestamp": message["timestamp"]
        })

    return history


def delete_conversation(conversation_id: str, user_id: str = None) -> dict:
    """
    Cascade-delete a conversation and all its associated messages from MongoDB.
    Guarantees that both the conversation entry and every message entry are removed.
    """
    query = {"conversation_id": conversation_id}
    if user_id:
        query["$or"] = [
            {"user_id": user_id},
            {"user_id": {"$exists": False}}
        ]

    conv = conversations_collection.find_one(query)
    if not conv:
        return {"deleted": False, "deleted_messages_count": 0}

    # 1. Delete all messages matching conversation_id from messages_collection
    msg_result = messages_collection.delete_many({"conversation_id": conversation_id})

    # 2. Delete the conversation record from conversations_collection
    conv_result = conversations_collection.delete_one({"conversation_id": conversation_id})

    return {
        "deleted": conv_result.deleted_count > 0,
        "deleted_messages_count": msg_result.deleted_count
    }
