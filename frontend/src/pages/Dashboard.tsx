import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import {
  fetchConversations,
  fetchConversation,
  streamAsk,
  streamFollowUp,
  deleteConversation as apiDeleteConversation,
  type ConversationSummary,
  type ParsedResponse,
} from "../lib/api";
import { Sidebar } from "../components/Sidebar";
import { SearchBar } from "../components/SearchBar";
import { MessageThread, type MessageItem } from "../components/MessageThread";
import { Menu, Plus, Sparkles, Zap, Brain } from "lucide-react";

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

    let convId = activeConvId;
    if (!convId) {
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
      <div className="h-screen flex items-center justify-center bg-[#0A0A0B]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-medium animate-pulse">Initializing</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isHome = messages.length === 0;

  return (
    <div className="h-screen flex bg-[#0A0A0B] font-sans selection:bg-primary/30" id="dashboard">
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
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* Abstract Background for Main Content */}
        {!isHome && (
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.02] blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
        )}

        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 z-20">
          <div className="flex items-center gap-4">
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-muted-foreground transition-all active:scale-95"
                id="sidebar-toggle"
            >
                <Menu className="w-5 h-5" />
            </button>

            {!isHome && (
                <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(226,184,89,0.5)]" />
                     <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Active Thread</span>
                </div>
            )}
          </div>

          {!isHome && (
            <button
              onClick={handleNewThread}
              className="flex items-center gap-2 px-4 py-2 rounded-xl
                         bg-white/5 hover:bg-white/10 border border-white/5
                         text-xs font-medium text-foreground transition-all duration-300 group active:scale-95"
              id="new-thread-top"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              New Search
            </button>
          )}
        </header>

        {isHome ? (
          /* Home state — centered search */
          <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
            <div className="flex flex-col items-center gap-12 w-full max-w-[720px] -mt-20">
              {/* Logo / Branding */}
              <div className="flex flex-col items-center gap-4 text-center animate-fade-in-up">
                <h1 className="text-6xl md:text-7xl font-serif text-foreground tracking-tight leading-tight">
                  Where <span className="text-primary italic">knowledge</span> begins.
                </h1>
                <p className="text-muted-foreground text-lg max-w-[500px] leading-relaxed font-sans">
                  The world's most advanced AI research engine, refined for clarity and depth.
                </p>
              </div>

              <SearchBar
                onSubmit={handleAsk}
                autoFocus
                variant="home"
              />

              {/* Enhanced quick suggestion chips */}
              <div className="flex flex-wrap gap-3 justify-center max-w-[600px] animate-fade-in-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
                {[
                  { text: "Quantum Physics", icon: <Sparkles className="w-3 h-3" /> },
                  { text: "Machine Learning", icon: <Brain className="w-3 h-3" /> },
                  { text: "Future of Web", icon: <Zap className="w-3 h-3" /> },
                  { text: "Architecture Trends", icon: <Plus className="w-3 h-3" /> },
                ].map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => handleAsk(suggestion.text)}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.05]
                               text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.08] hover:border-primary/20
                               transition-all duration-300 group"
                  >
                    <span className="text-primary/40 group-hover:text-primary transition-colors">{suggestion.icon}</span>
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Conversation state */
          <div className="flex-1 flex flex-col min-h-0 relative z-10">
            <div className="flex-1 overflow-y-auto scrollbar-none">
              <div className="max-w-[840px] mx-auto px-6 py-8">
                <MessageThread messages={messages} onFollowUp={handleFollowUp} />
              </div>
            </div>

            {/* Bottom search bar for follow-ups */}
            <div className="px-6 py-6 mt-auto">
              <div className="max-w-[840px] mx-auto">
                <div className="glass p-1 rounded-[28px] shadow-2xl">
                    <SearchBar
                    onSubmit={handleFollowUp}
                    placeholder="Ask a follow-up..."
                    disabled={isStreaming}
                    variant="inline"
                    />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
