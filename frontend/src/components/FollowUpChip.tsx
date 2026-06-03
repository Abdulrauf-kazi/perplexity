import { Plus } from "lucide-react";

interface FollowUpChipProps {
  question: string;
  onAsk: (question: string) => void;
}

export function FollowUpChip({ question, onAsk }: FollowUpChipProps) {
  return (
    <button
      type="button"
      onClick={() => onAsk(question)}
      className="text-left px-4 py-3 rounded-2xl
                 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] hover:border-primary/20
                 text-sm text-muted-foreground hover:text-foreground
                 transition-all duration-300 cursor-pointer
                 flex items-center justify-between group"
      id={`followup-${question.slice(0, 20).replace(/\s+/g, "-")}`}
    >
      <span className="truncate">{question}</span>
      <Plus
        className="w-4 h-4 text-primary/40 group-hover:text-primary transition-all duration-300 group-hover:rotate-90 group-hover:scale-110 flex-shrink-0 ml-4"
      />
    </button>
  );
}
