interface FollowUpChipProps {
  question: string;
  onAsk: (question: string) => void;
}

export function FollowUpChip({ question, onAsk }: FollowUpChipProps) {
  return (
    <button
      type="button"
      onClick={() => onAsk(question)}
      className="text-left px-3.5 py-2 rounded-xl
                 bg-[#232525] hover:bg-[#2E3030] border border-[#2E3030] hover:border-[#3A3D3D]
                 text-sm text-[#B0B0B0] hover:text-[#ECECEC]
                 transition-all duration-200 cursor-pointer
                 flex items-center gap-2 group"
      id={`followup-${question.slice(0, 20).replace(/\s+/g, "-")}`}
    >
      <svg
        className="w-3.5 h-3.5 text-[#20B8CD] opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      <span>{question}</span>
    </button>
  );
}
