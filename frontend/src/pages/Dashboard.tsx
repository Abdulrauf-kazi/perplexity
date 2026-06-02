import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchConversations,
  fetchConversation,
  streamAsk,
  streamFollowUp,
  deleteConversation as apiDeleteConversation,
  type ConversationSummary,
  type ParsedResponse,
} from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { SearchBar } from "@/components/SearchBar";
import { MessageThread, type MessageItem } from "@/components/MessageThread";

export default function Dashboard() {
  const { user, token, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!token) return;
    const convs = await fetchConversations(token);
    setConversations(convs);
  }, [token]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load conversation from URL param
  useEffect(() => {
    if (conversationId && token) {
      loadConversation(conversationId);
    } else if (!conversationId) {
      setMessages([]);
      setActiveConvId(null);
    }
  }, [conversationId, token]);

  const loadConversation = async (id: string) => {
    if (!token) return;
    const conv = await fetchConversation(token, id);
    if (!conv) return;

    setActiveConvId(id);
    const items: MessageItem[] = conv.messages.map((m) => ({
      id: String(m.id),
      role: m.role,
      content: m.content,
    }));
    setMessages(items);
  };

  // New search
  const handleAsk = async (query: string) => {
    if (!token || isStreaming) return;

    // Add user message immediately
    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: "User",
      content: query,
    };
    const aiMsg: MessageItem = {
      id: `ai-${Date.now()}`,
      role: "Assistance",
      content: "",
      isStreaming: true,
    };

    setMessages([userMsg, aiMsg]);
    setActiveConvId(null);
    setIsStreaming(true);

    // Navigate to home to clear any conversation route
    if (conversationId) {
      navigate("/");
    }

    await streamAsk(
      token,
      query,
      (text) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "Assistance") {
            updated[updated.length - 1] = { ...last, content: text };
          }
          return updated;
        });
      },
      (parsed: ParsedResponse) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "Assistance") {
            updated[updated.length - 1] = {
              ...last,
              content: parsed.answer,
              parsed,
              isStreaming: false,
            };
          }
          return updated;
        });
        setIsStreaming(false);
        // Refresh sidebar to show new conversation
        loadConversations();
      },
    );
  };

  // Follow-up
  const handleFollowUp = async (query: string) => {
    if (!token || isStreaming) return;

    // We need a conversation ID. If we don't have one, the user needs to find one.
    // The backend creates the conversation on the first ask, so after handleAsk
    // we need to find the newly created conversation.
    let convId = activeConvId;
    if (!convId) {
      // Fetch latest conversations to find the one we just created
      const convs = await fetchConversations(token);
      setConversations(convs);
      if (convs.length > 0) {
        convId = convs[0]!.id;
        setActiveConvId(convId);
      }
    }

    if (!convId) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: "User",
      content: query,
    };
    const aiMsg: MessageItem = {
      id: `ai-${Date.now()}`,
      role: "Assistance",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setIsStreaming(true);

    await streamFollowUp(
      token,
      convId,
      query,
      (text) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "Assistance") {
            updated[updated.length - 1] = { ...last, content: text };
          }
          return updated;
        });
      },
      (parsed: ParsedResponse) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "Assistance") {
            updated[updated.length - 1] = {
              ...last,
              content: parsed.answer,
              parsed,
              isStreaming: false,
            };
          }
          return updated;
        });
        setIsStreaming(false);
      },
    );
  };

  // Sidebar actions
  const handleNewThread = () => {
    setMessages([]);
    setActiveConvId(null);
    navigate("/");
    setSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    navigate(`/search/${id}`);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    if (!token) return;
    await apiDeleteConversation(token, id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      setMessages([]);
      setActiveConvId(null);
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#191A1A]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#20B8CD] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#8E8E8E] text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isHome = messages.length === 0;

  return (
    <div className="h-screen flex bg-[#191A1A]" id="dashboard">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        onNewThread={handleNewThread}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        user={user}
        onSignOut={signOut}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top bar */}
        <header className="flex items-center px-4 py-3 border-b border-[#2E3030]/50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-[#232525] text-[#8E8E8E] hover:text-[#ECECEC] transition-colors mr-2"
            id="sidebar-toggle"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {!isHome && (
            <button
              onClick={handleNewThread}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         bg-[#232525] hover:bg-[#2A2C2C] border border-[#2E3030]
                         text-xs text-[#A0A0A0] hover:text-[#ECECEC] transition-colors"
              id="new-thread-top"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Thread
            </button>
          )}
        </header>

        {isHome ? (
          /* Home state — centered search */
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="flex flex-col items-center gap-8 w-full max-w-[680px] -mt-16">
              {/* Logo / Branding */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#20B8CD] to-[#1A8A9A] flex items-center justify-center shadow-lg shadow-[#20B8CD]/10">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-[#ECECEC] tracking-tight">
                  Where knowledge begins
                </h1>
              </div>

              <SearchBar
                onSubmit={handleAsk}
                autoFocus
                variant="home"
              />

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-2 justify-center max-w-[500px]">
                {[
                  "What is quantum computing?",
                  "Explain WebAssembly",
                  "Best ways to learn Rust",
                  "How does DNS work?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleAsk(suggestion)}
                    className="px-3.5 py-1.5 rounded-full bg-[#202222] border border-[#2E3030]
                               text-xs text-[#8E8E8E] hover:text-[#ECECEC] hover:border-[#3A3D3D]
                               transition-all cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Conversation state */
          <>
            <div className="flex-1 overflow-y-auto pt-6">
              <MessageThread messages={messages} onFollowUp={handleFollowUp} />
            </div>

            {/* Bottom search bar for follow-ups */}
            <div className="border-t border-[#2E3030]/50 px-4 py-3">
              <div className="max-w-[780px] mx-auto">
                <SearchBar
                  onSubmit={handleFollowUp}
                  placeholder="Ask a follow-up..."
                  disabled={isStreaming}
                  variant="inline"
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}