const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:8000/api"
    : "https://contextmind-ai-backend.onrender.com/api");

// Attach the Firebase ID token to every protected request
function getHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Send a message
export async function sendMessage(message, conversationId = null, token) {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Unable to send message");
  }

  return data;
}

// Get the signed-in user's conversations
export async function getConversations(token) {
  const response = await fetch(`${API_URL}/conversations`, {
    headers: getHeaders(token),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Unable to load conversations");
  }

  return data;
}

// Get messages from a particular conversation
export async function getConversationMessages(conversationId, token) {
  const response = await fetch(
    `${API_URL}/conversations/${conversationId}/messages`,
    {
      headers: getHeaders(token),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Unable to load messages");
  }

  return data;
}

// Delete a conversation and its messages
export async function deleteConversation(conversationId, token) {
  const response = await fetch(
    `${API_URL}/conversations/${conversationId}`,
    {
      method: "DELETE",
      headers: getHeaders(token),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Unable to delete conversation");
  }

  return data;
}
