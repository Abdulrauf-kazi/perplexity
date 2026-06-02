import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";

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
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  };

  const isHome = variant === "home";

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative w-full ${isHome ? "max-w-[680px]" : ""}`}
      id="search-bar"
    >
      <div
        className={`relative flex items-end rounded-2xl border transition-all duration-200
          ${isHome
            ? "bg-[#202222] border-[#2E3030] shadow-lg shadow-black/20 hover:border-[#3A3D3D] focus-within:border-[#20B8CD]/40 focus-within:shadow-[0_0_20px_rgba(32,184,205,0.08)]"
            : "bg-[#232525] border-[#2E3030] hover:border-[#3A3D3D] focus-within:border-[#20B8CD]/30"
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
          className={`w-full bg-transparent text-[#ECECEC] placeholder-[#606060]
            resize-none outline-none scrollbar-none
            ${isHome ? "px-5 py-4 text-base" : "px-4 py-3 text-sm"}
            pr-14`}
          id="search-input"
        />

        <button
          type="submit"
          disabled={disabled || !query.trim()}
          className={`absolute right-3 flex items-center justify-center
            rounded-xl transition-all duration-200
            ${isHome ? "bottom-3 w-9 h-9" : "bottom-2 w-8 h-8"}
            ${query.trim() && !disabled
              ? "bg-[#20B8CD] text-[#0D0D0D] hover:bg-[#2DD4E8] cursor-pointer"
              : "bg-[#2A2C2C] text-[#606060] cursor-not-allowed"
            }`}
          id="search-submit"
        >
          <svg
            className={isHome ? "w-4.5 h-4.5" : "w-4 h-4"}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
