import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Paperclip, Globe } from "lucide-react";

interface SearchBarProps {
  onSubmit: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  variant?: "home" | "inline";
}

export function SearchBar({
  onSubmit,
  placeholder = "Ask anything...",
  disabled = false,
  autoFocus = false,
  variant = "home",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setQuery("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 240) + "px";
    }
  };

  const isHome = variant === "home";

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative w-full transition-all duration-500 ${isHome ? "max-w-[720px] animate-fade-in-up" : ""}`}
      id="search-bar"
    >
      <div
        className={`relative flex flex-col rounded-[24px] transition-all duration-300 group
          ${isHome
            ? "glass-dark border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-white/10 focus-within:border-primary/30"
            : "bg-secondary/40 border-white/5 focus-within:border-primary/30"
          }`}
      >
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          rows={1}
          className={`w-full bg-transparent text-foreground placeholder-muted-foreground/50
            resize-none outline-none scrollbar-none font-sans
            ${isHome ? "px-6 pt-5 pb-16 text-lg leading-relaxed" : "px-5 pt-4 pb-14 text-base"}`}
          id="search-input"
        />

        <div className={`absolute bottom-0 left-0 right-0 flex items-center justify-between ${isHome ? "px-4 pb-4" : "px-3 pb-3"}`}>
          <div className="flex items-center gap-1">
            <button 
              type="button" 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all duration-200 group/btn"
            >
              <Globe className="w-4 h-4 group-hover/btn:text-primary transition-colors" />
              <span className="text-[11px] font-medium tracking-wider uppercase">Deep Search</span>
            </button>
            <button 
              type="button" 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all duration-200 group/btn"
            >
              <Paperclip className="w-4 h-4 group-hover/btn:text-primary transition-colors" />
              <span className="text-[11px] font-medium tracking-wider uppercase">Attach</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={disabled || !query.trim()}
            className={`flex items-center justify-center rounded-full transition-all duration-500
              ${isHome ? "w-10 h-10" : "w-9 h-9"}
              ${query.trim() && !disabled
                ? "bg-primary text-black hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 cursor-pointer"
                : "bg-white/5 text-muted-foreground/30 cursor-not-allowed"
              }`}
            id="search-submit"
          >
            <ArrowUp
              className={isHome ? "w-5 h-5" : "w-4.5 h-4.5"}
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>
      
      {isHome && (
        <div className="mt-4 flex items-center justify-center gap-6 animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards]">
           <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
             <div className="w-1 h-1 rounded-full bg-primary/40" />
             AI Search
           </div>
           <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
             <div className="w-1 h-1 rounded-full bg-primary/40" />
             Real-time
           </div>
           <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
             <div className="w-1 h-1 rounded-full bg-primary/40" />
             Deep Reasoning
           </div>
        </div>
      )}
    </form>
  );
}
