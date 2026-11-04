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
  Menu,
  X,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      setSidebarOpen(false);
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
    setSidebarOpen(false);
  }

  // Open an existing conversation
  async function handleSelectConversation(id) {
    if (loading || historyLoading || !user) return;

    setSidebarOpen(false);
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
      <div className="h-screen flex items-center justify-center bg-[#0b1120] text-white px-4">
        <div className="flex items-center gap-3 text-gray-400 text-sm sm:text-base">
          <LoaderCircle className="animate-spin text-blue-500" size={24} />
          Checking authentication...
        </div>
      </div>
    );
  }

  // Google login screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1120] text-white px-4 py-8">
        <div className="w-full max-w-md bg-[#111827] border border-gray-800 rounded-2xl p-6 sm:p-8 text-center shadow-xl">

          <div className="inline-flex bg-blue-600 p-3.5 sm:p-4 rounded-2xl mb-5 sm:mb-6 shadow-lg shadow-blue-500/20">
            <BrainCircuit size={36} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
            ContextMind AI
          </h1>

          <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 leading-relaxed">
            Your intelligent AI assistant that remembers your conversations.
          </p>

          <button
            onClick={handleLogin}
            disabled={loginLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold p-3.5 sm:p-4 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition active:scale-[0.99]"
          >
            {loginLoading ? (
              <LoaderCircle size={20} className="animate-spin" />
            ) : (
              <Globe size={20} />
            )}

            <span className="text-sm sm:text-base">
              {loginLoading ? "Signing in..." : "Continue with Google"}
            </span>
          </button>

          {error && (
            <p className="text-red-400 text-xs sm:text-sm mt-5 bg-red-950/40 border border-red-900/50 p-3 rounded-lg break-words">{error}</p>
          )}

          <p className="text-xs text-gray-500 mt-6 sm:mt-8">
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
    <div className="flex h-screen bg-[#0b1120] text-white overflow-hidden relative">

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 sm:w-80 md:w-72 bg-[#111827] border-r border-gray-800 p-5 flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-md shadow-blue-500/20">
              <BrainCircuit size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">ContextMind AI</h1>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <button
          onClick={handleNewChat}
          disabled={loading || historyLoading}
          className="flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 p-3 rounded-xl font-medium transition shadow-sm active:scale-[0.99]"
        >
          <Plus size={19} />
          New Chat
        </button>

        {/* Recent conversations */}
        <div className="mt-8 flex-1 min-h-0 overflow-y-auto">

          <p className="text-xs text-gray-500 font-semibold mb-3 px-1 tracking-wider">
            RECENT CHATS
          </p>

          {conversations.length === 0 ? (
            <p className="text-sm text-gray-500 px-2 py-4">
              No conversations yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              {conversations.map((conversation) => (
                <div
                  key={conversation.conversation_id}
                  className={`group w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition ${
                    conversationId === conversation.conversation_id
                      ? "bg-gray-800/90 text-white shadow-inner"
                      : "text-gray-300 hover:bg-gray-800/50"
                  }`}
                >
                  <button
                    onClick={() =>
                      handleSelectConversation(conversation.conversation_id)
                    }
                    disabled={loading || historyLoading || deletingId === conversation.conversation_id}
                    className="flex items-start gap-2.5 min-w-0 flex-1 text-left"
                  >
                    <MessageSquare size={17} className="shrink-0 mt-0.5 text-gray-400 group-hover:text-blue-400 transition" />

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm truncate font-medium">
                        {conversation.title || `Chat ${conversation.conversation_id.slice(0, 8)}`}
                      </span>

                      <span className="block text-[11px] text-gray-500 mt-0.5">
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
                    className="opacity-70 md:opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-700/50 transition ml-2 shrink-0"
                  >
                    {deletingId === conversation.conversation_id ? (
                      <LoaderCircle size={15} className="animate-spin text-red-400" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User profile and logout */}
        <div className="border-t border-gray-800 pt-4 mt-2">

          <div className="flex items-center gap-3 mb-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-9 h-9 rounded-full ring-2 ring-blue-600/30"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center">
                <User size={18} />
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
            className="w-full flex items-center gap-2.5 text-xs text-gray-400 hover:text-red-400 hover:bg-gray-800/40 p-2 rounded-lg transition"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>

      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Top Header */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-3 sm:px-6 md:px-8 shrink-0 bg-[#0b1120]/80 backdrop-blur z-10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-3">
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition shrink-0"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div className="font-semibold text-sm sm:text-base truncate max-w-[180px] sm:max-w-xs md:max-w-md">
              {conversationId
                ? activeConversation?.title || "Conversation"
                : "New Conversation"}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {conversationId && (
              <button
                onClick={(e) => handleDeleteConversation(e, conversationId)}
                disabled={deletingId === conversationId || loading}
                title="Delete this conversation"
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 p-2 sm:px-3 sm:py-1.5 rounded-lg hover:bg-gray-800 transition"
              >
                {deletingId === conversationId ? (
                  <LoaderCircle size={15} className="animate-spin text-red-400" />
                ) : (
                  <Trash2 size={15} />
                )}
                <span className="hidden sm:inline">Delete Chat</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 text-green-400 text-xs bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="hidden xs:inline font-medium">Online</span>
            </div>
          </div>
        </header>

        {/* Messages Scroll Area */}
        <section className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-8">

          {historyLoading ? (
            <div className="h-full flex items-center justify-center gap-3 text-gray-400 text-sm">
              <LoaderCircle size={22} className="animate-spin text-blue-500" />
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">

              <div className="bg-blue-600/15 p-4 sm:p-5 rounded-2xl mb-4 sm:mb-6 shadow-inner">
                <Sparkles size={32} className="text-blue-400 sm:w-10 sm:h-10" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 tracking-tight">
                How can I help you today?
              </h2>

              <p className="text-sm sm:text-base text-gray-400 max-w-md">
                Ask anything. ContextMind remembers your conversations.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2.5 sm:gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "model" && (
                    <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg h-fit shrink-0 shadow-md">
                      <BrainCircuit size={18} className="sm:w-5 sm:h-5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[80%] p-3.5 sm:p-4 rounded-2xl whitespace-pre-wrap text-sm sm:text-base break-words leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm shadow-md"
                        : "bg-[#1f2937] text-gray-200 rounded-bl-sm border border-gray-800"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {msg.role === "user" && (
                    <div className="bg-gray-700 p-1.5 sm:p-2 rounded-lg h-fit shrink-0">
                      <User size={18} className="sm:w-5 sm:h-5" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 text-gray-400 text-sm py-2">
                  <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg">
                    <BrainCircuit size={18} />
                  </div>

                  <LoaderCircle size={18} className="animate-spin text-blue-400" />
                  <span>ContextMind is thinking...</span>
                </div>
              )}

            </div>
          )}

        </section>

        {/* Error Notification */}
        {error && (
          <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pb-2 text-red-400 text-xs sm:text-sm">
            <div className="bg-red-950/40 border border-red-900/50 p-2.5 rounded-lg break-words">
              {error}
            </div>
          </div>
        )}

        {/* Message input */}
        <form
          onSubmit={handleSendMessage}
          className="px-3 sm:px-6 pb-3 sm:pb-6 pt-2 shrink-0 bg-[#0b1120]"
        >
          <div className="max-w-3xl mx-auto flex items-center gap-2 sm:gap-3 bg-[#1f2937] border border-gray-700 rounded-2xl p-2 sm:p-3 focus-within:border-blue-500 transition shadow-lg">

            <input
              type="text"
              placeholder="Message ContextMind AI..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading || historyLoading}
              className="flex-1 min-w-0 bg-transparent outline-none text-white placeholder-gray-500 disabled:opacity-50 text-sm sm:text-base px-2 py-1"
            />

            <button
              type="submit"
              disabled={loading || historyLoading || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 p-2.5 sm:p-3 rounded-xl transition shrink-0 active:scale-95"
              aria-label="Send message"
            >
              {loading ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>

          </div>

          <p className="text-[11px] sm:text-xs text-gray-500 text-center mt-2 px-2">
            ContextMind AI can make mistakes. Verify important information.
          </p>
        </form>

      </main>
    </div>
  );
}

export default App;
