import type { ConversationSummary } from "@/lib/api";

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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col
          bg-[#171818] border-r border-[#2E3030]
          transition-transform duration-300 ease-in-out
          w-[260px]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto`}
        id="sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-4 pb-2">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-[#232525] text-[#8E8E8E] hover:text-[#ECECEC] transition-colors"
            id="sidebar-toggle-inner"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <button
            onClick={onNewThread}
            className="p-1.5 rounded-lg hover:bg-[#232525] text-[#8E8E8E] hover:text-[#ECECEC] transition-colors"
            id="new-thread-btn"
            title="New Thread"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-[#606060]">
              No conversations yet
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-1 px-3 py-2 rounded-lg cursor-pointer transition-colors
                    ${activeId === conv.id
                      ? "bg-[#232525] text-[#ECECEC]"
                      : "text-[#A0A0A0] hover:bg-[#1E2020] hover:text-[#D4D4D4]"
                    }`}
                  onClick={() => onSelect(conv.id)}
                  id={`conv-${conv.id}`}
                >
                  <span className="flex-1 text-sm truncate">
                    {conv.title || "Untitled"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#2E3030]
                               text-[#606060] hover:text-[#E5484D] transition-all"
                    title="Delete"
                    id={`delete-conv-${conv.id}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User section */}
        {user && (
          <div className="border-t border-[#2E3030] px-3 py-3">
            <div className="flex items-center gap-2.5">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#20B8CD] to-[#1A8A9A] flex items-center justify-center text-[10px] font-semibold text-white">
                  {(user.email?.[0] ?? "?").toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#ECECEC] truncate">
                  {user.user_metadata?.full_name ?? user.email}
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg hover:bg-[#232525] text-[#606060] hover:text-[#E5484D] transition-colors"
                title="Sign out"
                id="signout-btn"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
