import { useRef, useEffect } from "react";
import type { ParsedResponse } from "@/lib/api";
import { SourcePill } from "./SourcePill";
import { FollowUpChip } from "./FollowUpChip";

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
    <div className="flex flex-col gap-6 w-full max-w-[780px] mx-auto px-4 pb-4" id="message-thread">
      {messages.map((msg, idx) => (
        <div
          key={msg.id}
          className={`animate-fade-in-up ${msg.role === "User" ? "flex justify-end" : ""}`}
          style={{ animationDelay: `${idx * 0.05}s` }}
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
      <div ref={bottomRef} />
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="max-w-[85%]">
      <div className="bg-[#2A2C2C] border border-[#353737] rounded-2xl rounded-br-md px-4 py-2.5 text-[#ECECEC] text-[15px]">
        {content}
      </div>
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
    <div className="flex gap-3">
      {/* AI avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#20B8CD] to-[#1A8A9A] flex items-center justify-center mt-1">
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        {/* Sources row */}
        {sources.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-[#8E8E8E] mr-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              <span>{sources.length} sources</span>
            </div>
            {sources.map((s, i) => (
              <SourcePill key={i} url={s.url} index={i} />
            ))}
          </div>
        )}

        {/* Answer content */}
        <div
          className={`markdown-content text-[15px] leading-relaxed ${msg.isStreaming ? "typing-cursor" : ""}`}
        >
          <RenderMarkdown text={displayContent} />
        </div>

        {/* Follow-up suggestions */}
        {!msg.isStreaming && followUps.length > 0 && isLast && (
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-xs text-[#606060] mb-1">Related</span>
            {followUps.map((q, i) => (
              <FollowUpChip key={i} question={q} onAsk={onFollowUp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RenderMarkdown({ text }: { text: string }) {
  // Simple markdown-to-HTML converter for headings, bold, italic, code, lists, links
  const html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // H3
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // H2
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // H1
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered lists
    .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br />');

  return (
    <div dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />
  );
}
