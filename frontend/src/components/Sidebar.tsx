import type { ConversationSummary } from "../lib/api";
import { Plus, Trash2, LogOut, MessageSquare, Compass } from "lucide-react";

interface SidebarProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onNewThread: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  user: { email?: string; user_metadata?: { full_name?: string; avatar_url?: string } } | null;
  onSignOut: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({
  conversations,
  activeId,
  onNewThread,
  onSelect,
  onDelete,
  user,
  onSignOut,
  isOpen,
  onToggle,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col
          bg-sidebar border-r border-sidebar-border
          transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          w-[280px]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto`}
        id="sidebar"
      >
        {/* Header */}
        <div className="flex flex-col gap-6 px-4 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <span className="font-serif text-2xl text-foreground tracking-tight">Perplexity</span>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-muted-foreground transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <button
            onClick={onNewThread}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-black transition-all duration-300 font-medium text-sm group active:scale-95"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>New Thread</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-3 flex flex-col gap-1">
             <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl cursor-pointer transition-all duration-200 group">
                <Compass className="w-4 h-4 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium tracking-wide">Discover</span>
             </div>
             <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl cursor-pointer transition-all duration-200 group">
                <MessageSquare className="w-4 h-4 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium tracking-wide">Library</span>
             </div>
        </nav>

        {/* Conversation list */}
        <div className="mt-6 flex-1 overflow-y-auto px-3 scrollbar-none">
          <div className="px-4 mb-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/50">
            Recent Threads
          </div>
          {conversations.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground/30 italic font-serif">
              A blank slate for your thoughts
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-1 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300
                    ${activeId === conv.id
                      ? "bg-white/5 text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    }`}
                  onClick={() => onSelect(conv.id)}
                  id={`conv-${conv.id}`}
                >
                  <span className="flex-1 text-sm truncate font-sans">
                    {conv.title || "Untitled Thread"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10
                               text-muted-foreground hover:text-destructive transition-all duration-200"
                    title="Delete"
                    id={`delete-conv-${conv.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User section */}
        {user && (
          <div className="border-t border-sidebar-border/50 px-4 py-6 mt-auto">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-2xl border border-white/10 group-hover:border-primary/50 transition-colors"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-serif text-primary border border-primary/20 group-hover:border-primary/50 transition-colors">
                    {(user.email?.[0] ?? "?").toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-sidebar rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">
                   Premium
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-destructive transition-all duration-300"
                title="Sign out"
                id="signout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
