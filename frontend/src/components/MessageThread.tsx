import { useRef, useEffect } from "react";
import type { ParsedResponse } from "../lib/api";
import { SourcePill } from "./SourcePill";
import { FollowUpChip } from "./FollowUpChip";
import { User, Sparkles, Share2, Copy, Layers, Plus } from "lucide-react";

export interface MessageItem {
  id: string;
  role: "User" | "Assistance";
  content: string;
  parsed?: ParsedResponse;
  isStreaming?: boolean;
}

interface MessageThreadProps {
  messages: MessageItem[];
  onFollowUp: (question: string) => void;
}

export function MessageThread({ messages, onFollowUp }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messages[messages.length - 1]?.content]);

  return (
    <div className="flex flex-col gap-12 w-full" id="message-thread">
      {messages.map((msg, idx) => (
        <div
          key={msg.id}
          className={`animate-fade-in-up`}
          style={{ animationDelay: `${idx * 0.1}s` }}
        >
          {msg.role === "User" ? (
            <UserMessage content={msg.content} />
          ) : (
            <AIMessage
              msg={msg}
              isLast={idx === messages.length - 1}
              onFollowUp={onFollowUp}
            />
          )}
        </div>
      ))}
      <div ref={bottomRef} className="h-20" />
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-3">
       <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center border border-white/5">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">You</span>
       </div>
       <h2 className="text-3xl font-serif text-foreground leading-tight tracking-tight">
         {content}
       </h2>
    </div>
  );
}

function AIMessage({
  msg,
  isLast,
  onFollowUp,
}: {
  msg: MessageItem;
  isLast: boolean;
  onFollowUp: (q: string) => void;
}) {
  const sources = msg.parsed?.sources ?? [];
  const followUps = msg.parsed?.followUps ?? [];
  const displayContent = msg.parsed?.answer ?? msg.content;

  return (
    <div className="flex flex-col gap-6 pt-6 border-t border-white/5">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="text-[11px] font-semibold text-primary uppercase tracking-widest">Perplexity AI</span>
          </div>
          
          <div className="flex items-center gap-2">
             <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground/40 hover:text-foreground transition-all">
                <Copy className="w-3.5 h-3.5" />
             </button>
             <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground/40 hover:text-foreground transition-all">
                <Share2 className="w-3.5 h-3.5" />
             </button>
          </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Sources row */}
        {sources.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              <Layers className="w-3 h-3" />
              <span>Sourced Knowledge ({sources.length})</span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {sources.map((s, i) => (
                <SourcePill key={i} url={s.url} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Answer content */}
        <div
          className={`markdown-content text-[17px] leading-relaxed font-sans text-[#E5E5E5] ${msg.isStreaming ? "typing-cursor" : ""}`}
        >
          <RenderMarkdown text={displayContent} />
        </div>

        {/* Follow-up suggestions */}
        {!msg.isStreaming && followUps.length > 0 && isLast && (
          <div className="flex flex-col gap-4 pt-8 mt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              <Plus className="w-3 h-3" />
              <span>Explore Further</span>
            </div>
            <div className="flex flex-col gap-2">
              {followUps.map((q, i) => (
                <FollowUpChip key={i} question={q} onAsk={onFollowUp} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RenderMarkdown({ text }: { text: string }) {
  const html = text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');

  return (
    <div dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />
  );
}
