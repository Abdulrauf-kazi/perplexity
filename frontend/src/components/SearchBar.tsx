import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

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
            ${isHome ? "px-6 pt-5 pb-12 text-lg leading-relaxed" : "px-5 pt-4 pb-10 text-base"}`}
          id="search-input"
        />

        <div className={`absolute bottom-0 left-0 right-0 flex items-center justify-end ${isHome ? "px-4 pb-4" : "px-3 pb-3"}`}>
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
    </form>
  );
}
