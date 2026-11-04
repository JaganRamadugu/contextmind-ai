import { useState, useEffect } from "react";

import {
  BrainCircuit,
  Plus,
  MessageSquare,
  Send,
  Sparkles,
  LoaderCircle,
  User,
  LogOut,
  Globe,
  Trash2,
} from "lucide-react";

import {
  sendMessage,
  getConversations,
  getConversationMessages,
  deleteConversation,
} from "./services/api";

import {
  loginWithGoogle,
  logout,
  listenToAuthChanges,
} from "./services/auth";

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  // Monitor Firebase authentication
  useEffect(() => {
    const unsubscribe = listenToAuthChanges(async (currentUser) => {
      setUser(currentUser);
      setError("");
      setMessages([]);
      setConversations([]);
      setConversationId(null);

      if (currentUser) {
        const token = await currentUser.getIdToken();

        try {
          const data = await getConversations(token);
          setConversations(data);
        } catch (err) {
          setError(err.message || "Unable to load conversations.");
        }
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google sign-in
  async function handleLogin() {
    setLoginLoading(true);
    setError("");

    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoginLoading(false);
    }
  }

  // Logout
  async function handleLogout() {
    try {
      await logout();
      setMessages([]);
      setConversations([]);
      setConversationId(null);
      setMessage("");
    } catch (err) {
      setError(err.message || "Logout failed.");
    }
  }

  // Load conversations
  async function loadConversations(token) {
    try {
      const data = await getConversations(token);
      setConversations(data);
    } catch (err) {
      setError(err.message || "Unable to load conversations.");
    }
  }

  // Send a message
  async function handleSendMessage(e) {
    e.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading || historyLoading || !user) return;

    const userMessage = {
      role: "user",
      content: trimmedMessage,
    };

    setMessages((previous) => [...previous, userMessage]);
    setMessage("");
    setLoading(true);
    setError("");

    try {
      const token = await user.getIdToken();

      const data = await sendMessage(
        trimmedMessage,
        conversationId,
        token
      );

      setConversationId(data.conversation_id);

      setMessages((previous) => [
        ...previous,
        {
          role: "model",
          content: data.reply,
        },
      ]);

      await loadConversations(token);
    } catch (err) {
      setError(err.message || "Unable to connect to ContextMind AI.");
      setMessages((previous) => previous.slice(0, -1));
      setMessage(trimmedMessage);
    } finally {
      setLoading(false);
    }
  }

  // Start a new conversation
  function handleNewChat() {
    setMessages([]);
    setConversationId(null);
    setMessage("");
    setError("");
  }

  // Open an existing conversation
  async function handleSelectConversation(id) {
    if (loading || historyLoading || !user) return;

    setHistoryLoading(true);
    setError("");

    try {
      const token = await user.getIdToken();
      const data = await getConversationMessages(id, token);

      setConversationId(data.conversation_id);
      setMessages(data.messages);
      setMessage("");
    } catch (err) {
      setError(err.message || "Unable to load this conversation.");
    } finally {
      setHistoryLoading(false);
    }
  }

  // Delete a conversation from state and database
  async function handleDeleteConversation(e, id) {
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this chat? It will be permanently removed from the database.")) {
      return;
    }

    setDeletingId(id);
    setError("");

    try {
      const token = user ? await user.getIdToken() : null;
      await deleteConversation(id, token);

      // Remove from list
      setConversations((prev) =>
        prev.filter((c) => c.conversation_id !== id)
      );

      // If active conversation was deleted, clear chat window
      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
        setMessage("");
      }
    } catch (err) {
      setError(err.message || "Unable to delete conversation.");
    } finally {
      setDeletingId(null);
    }
  }

  // Format conversation date
  function formatDate(dateString) {
    return new Date(dateString).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Authentication loading screen
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0b1120] text-white">
        <div className="flex items-center gap-3 text-gray-400">
          <LoaderCircle className="animate-spin" size={24} />
          Checking authentication...
        </div>
      </div>
    );
  }

  // Google login screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1120] text-white px-5">
        <div className="w-full max-w-md bg-[#111827] border border-gray-800 rounded-2xl p-8 text-center">

          <div className="inline-flex bg-blue-600 p-4 rounded-2xl mb-6">
            <BrainCircuit size={38} />
          </div>

          <h1 className="text-3xl font-bold mb-3">
            ContextMind AI
          </h1>

          <p className="text-gray-400 mb-8">
            Your intelligent AI assistant that remembers your conversations.
          </p>

          <button
            onClick={handleLogin}
            disabled={loginLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold p-4 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition"
          >
            {loginLoading ? (
              <LoaderCircle size={20} className="animate-spin" />
            ) : (
              <Globe size={20} />
            )}

            {loginLoading ? "Signing in..." : "Continue with Google"}
          </button>

          {error && (
            <p className="text-red-400 text-sm mt-5">{error}</p>
          )}

          <p className="text-xs text-gray-500 mt-8">
            Sign in securely with your Google account.
          </p>
        </div>
      </div>
    );
  }

  const activeConversation = conversations.find(
    (c) => c.conversation_id === conversationId
  );

  return (
    <div className="flex h-screen bg-[#0b1120] text-white">

      {/* Sidebar */}
      <aside className="w-72 bg-[#111827] border-r border-gray-800 p-5 flex flex-col shrink-0">

        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-xl">
            <BrainCircuit size={25} />
          </div>
          <h1 className="text-xl font-bold">ContextMind AI</h1>
        </div>

        <button
          onClick={handleNewChat}
          disabled={loading || historyLoading}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 p-3 rounded-xl transition"
        >
          <Plus size={20} />
          New Chat
        </button>

        {/* Recent conversations */}
        <div className="mt-10 flex-1 min-h-0 overflow-y-auto">

          <p className="text-xs text-gray-500 font-semibold mb-4">
            RECENT CHATS
          </p>

          {conversations.length === 0 ? (
            <p className="text-sm text-gray-500 px-3">
              No conversations yet.
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.conversation_id}
                  className={`group w-full flex items-center justify-between p-3 rounded-lg text-left transition ${
                    conversationId === conversation.conversation_id
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <button
                    onClick={() =>
                      handleSelectConversation(conversation.conversation_id)
                    }
                    disabled={loading || historyLoading || deletingId === conversation.conversation_id}
                    className="flex items-start gap-3 min-w-0 flex-1 text-left"
                  >
                    <MessageSquare size={18} className="shrink-0 mt-1" />

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm truncate font-medium">
                        {conversation.title || `Chat ${conversation.conversation_id.slice(0, 8)}`}
                      </span>

                      <span className="block text-xs text-gray-500 mt-1">
                        {formatDate(conversation.updated_at)}
                      </span>
                    </span>
                  </button>

                  <button
                    onClick={(e) =>
                      handleDeleteConversation(e, conversation.conversation_id)
                    }
                    disabled={deletingId === conversation.conversation_id || loading}
                    title="Delete conversation"
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-600/50 transition ml-2 shrink-0"
                  >
                    {deletingId === conversation.conversation_id ? (
                      <LoaderCircle size={16} className="animate-spin text-red-400" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User profile and logout */}
        <div className="border-t border-gray-800 pt-5">

          <div className="flex items-center gap-3 mb-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <User size={20} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {user.displayName || "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition"
          >
            <LogOut size={19} />
            Sign out
          </button>
        </div>

      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">

        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 shrink-0">
          <div className="font-medium text-base truncate max-w-md">
            {conversationId
              ? activeConversation?.title || "Conversation"
              : "New Conversation"}
          </div>

          <div className="flex items-center gap-4">
            {conversationId && (
              <button
                onClick={(e) => handleDeleteConversation(e, conversationId)}
                disabled={deletingId === conversationId || loading}
                title="Delete this conversation"
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
              >
                {deletingId === conversationId ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                <span>Delete Chat</span>
              </button>
            )}

            <div className="flex items-center gap-2 text-green-400 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Online
            </div>
          </div>
        </header>

        {/* Messages */}
        <section className="flex-1 overflow-y-auto px-6 py-8">

          {historyLoading ? (
            <div className="h-full flex items-center justify-center gap-3 text-gray-400">
              <LoaderCircle size={22} className="animate-spin" />
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">

              <div className="bg-blue-600/15 p-5 rounded-2xl mb-6">
                <Sparkles size={35} className="text-blue-400" />
              </div>

              <h2 className="text-3xl font-bold mb-3">
                How can I help you today?
              </h2>

              <p className="text-gray-400">
                Ask anything. ContextMind remembers your conversations.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "model" && (
                    <div className="bg-blue-600 p-2 rounded-lg h-fit">
                      <BrainCircuit size={19} />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] p-4 rounded-2xl whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-[#1f2937] text-gray-200"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {msg.role === "user" && (
                    <div className="bg-gray-700 p-2 rounded-lg h-fit">
                      <User size={19} />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <BrainCircuit size={19} />
                  </div>

                  <LoaderCircle size={18} className="animate-spin" />
                  <span className="text-sm">
                    ContextMind is thinking...
                  </span>
                </div>
              )}

            </div>
          )}

        </section>

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto w-full px-6 pb-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Message input */}
        <form
          onSubmit={handleSendMessage}
          className="px-6 pb-6 pt-3 shrink-0"
        >
          <div className="max-w-3xl mx-auto flex items-center gap-3 bg-[#1f2937] border border-gray-700 rounded-2xl p-3">

            <input
              type="text"
              placeholder="Message ContextMind AI..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading || historyLoading}
              className="flex-1 min-w-0 bg-transparent outline-none text-white placeholder-gray-500 disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={loading || historyLoading || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 p-3 rounded-xl transition"
            >
              {loading ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>

          </div>

          <p className="text-xs text-gray-600 text-center mt-3">
            ContextMind AI can make mistakes. Verify important information.
          </p>
        </form>

      </main>
    </div>
  );
}

export default App;
