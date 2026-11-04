from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
import logging

from app.auth import get_current_user
from app.gemini import generate_response
from app.memory import (
    create_conversation,
    save_message,
    get_conversation_history,
    get_all_messages,
    delete_conversation,
    update_conversation_title,
)
from app.database import conversations_collection


router = APIRouter()
logger = logging.getLogger(__name__)


# Request models
class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    conversation_id: Optional[str] = None


class RenameRequest(BaseModel):
    title: str = Field(min_length=1, max_length=100)


def generate_smart_title(prompt: str) -> str:
    """Generate a clean, readable title from the first prompt without cutting words in half."""
    clean_text = " ".join(prompt.strip().split())
    if len(clean_text) <= 45:
        return clean_text
    truncated = clean_text[:45].rsplit(" ", 1)[0]
    return (truncated if truncated else clean_text[:45]) + "..."


# Chat endpoint (isolated per authenticated user)
@router.post("/chat")
def chat(request: ChatRequest, user: dict = Depends(get_current_user)):
    user_id = user["user_id"]

    try:
        # Check whether this is a new conversation
        if request.conversation_id is None:
            title = generate_smart_title(request.message)
            conversation_id = create_conversation(user_id=user_id, title=title)
            history = []
        else:
            conversation_id = request.conversation_id

            # Verify conversation exists and belongs to the authenticated user
            conversation = conversations_collection.find_one({
                "conversation_id": conversation_id,
                "user_id": user_id
            })

            if conversation is None:
                raise HTTPException(
                    status_code=404,
                    detail="Conversation not found"
                )

            title = conversation.get("title") or f"Chat {conversation_id[:8]}"
            history = get_conversation_history(conversation_id)

        # Add latest user message to Gemini history
        history.append({
            "role": "user",
            "content": request.message
        })

        # Generate Gemini response
        reply = generate_response(history)

        # Save both messages in MongoDB tagged with the user's ID
        save_message(
            conversation_id,
            "user",
            request.message,
            user_id=user_id
        )

        save_message(
            conversation_id,
            "model",
            reply,
            user_id=user_id
        )

        return {
            "conversation_id": conversation_id,
            "title": title,
            "reply": reply
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Chat request failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Unable to generate response: {exc}"
        )


# Get recent conversations belonging strictly to the signed-in user
@router.get("/conversations")
def get_conversations(
    limit: int = Query(default=50, ge=1, le=100),
    user: dict = Depends(get_current_user)
):
    user_id = user["user_id"]

    try:
        conversations = conversations_collection.find(
            {"user_id": user_id},
            {
                "_id": 0,
                "conversation_id": 1,
                "title": 1,
                "created_at": 1,
                "updated_at": 1
            }
        ).sort(
            "updated_at", -1
        ).limit(limit)

        results = []
        for conv in conversations:
            if not conv.get("title"):
                conv["title"] = f"Chat {conv['conversation_id'][:8]}"
            results.append(conv)

        return results
    except Exception as exc:
        logger.exception("Failed to fetch conversations for user %s: %s", user_id, exc)
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {exc}"
        )


# Get messages from a particular conversation (only if owned by the signed-in user)
@router.get("/conversations/{conversation_id}/messages")
def get_messages(
    conversation_id: str,
    user: dict = Depends(get_current_user)
):
    user_id = user["user_id"]

    try:
        conversation = conversations_collection.find_one({
            "conversation_id": conversation_id,
            "user_id": user_id
        })

        if conversation is None:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found"
            )

        messages = get_all_messages(conversation_id)

        return {
            "conversation_id": conversation_id,
            "title": conversation.get("title") or f"Chat {conversation_id[:8]}",
            "messages": messages
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch messages for conversation %s: %s", conversation_id, exc)
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {exc}"
        )


# Rename a conversation
@router.patch("/conversations/{conversation_id}")
def rename_conversation(
    conversation_id: str,
    request: RenameRequest,
    user: dict = Depends(get_current_user)
):
    user_id = user["user_id"]

    try:
        success = update_conversation_title(
            conversation_id=conversation_id,
            title=request.title.strip(),
            user_id=user_id
        )

        if not success:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found"
            )

        return {
            "message": "Title updated successfully",
            "conversation_id": conversation_id,
            "title": request.title.strip()
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to rename conversation %s: %s", conversation_id, exc)
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {exc}"
        )


# Delete a conversation and all its messages (only if owned by the signed-in user)
@router.delete("/conversations/{conversation_id}")
def delete_conversation_route(
    conversation_id: str,
    user: dict = Depends(get_current_user)
):
    user_id = user["user_id"]

    try:
        result = delete_conversation(conversation_id, user_id=user_id)
        if not result.get("deleted"):
            raise HTTPException(
                status_code=404,
                detail="Conversation not found"
            )

        return {
            "message": "Conversation and all associated messages successfully deleted from database",
            "conversation_id": conversation_id,
            "deleted_messages_count": result.get("deleted_messages_count", 0)
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to delete conversation %s: %s", conversation_id, exc)
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {exc}"
        )
