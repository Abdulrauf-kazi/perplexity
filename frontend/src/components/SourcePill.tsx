interface SourcePillProps {
  url: string;
  index: number;
}

export function SourcePill({ url, index }: SourcePillProps) {
  let domain: string;
  try {
    domain = new URL(url).hostname.replace("www.", "");
  } catch {
    domain = url;
  }

  const favicon = `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex flex-col gap-2 p-3 rounded-2xl
                 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-primary/20
                 text-xs transition-all duration-300 cursor-pointer group min-w-[140px] max-w-[180px]"
      id={`source-pill-${index}`}
    >
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-lg bg-black/40 flex items-center justify-center border border-white/5 overflow-hidden group-hover:border-primary/20 transition-colors">
            <img
            src={favicon}
            alt=""
            width={12}
            height={12}
            className="rounded-[2px] opacity-70 group-hover:opacity-100 transition-opacity"
            onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
            }}
            />
        </div>
        <span className="font-medium text-foreground truncate text-[11px] tracking-tight">{domain}</span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
        <span className="truncate max-w-[80px]">Reference</span>
        <span className="font-serif italic text-primary/40 group-hover:text-primary transition-colors">No. {index + 1}</span>
      </div>
    </a>
  );
}
