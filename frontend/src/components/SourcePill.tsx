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

  const favicon = `https://www.google.com/s2/favicons?sz=16&domain=${domain}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                 bg-[#2A2C2C] hover:bg-[#353737] border border-[#2E3030]
                 text-xs text-[#A0A0A0] hover:text-[#ECECEC]
                 transition-all duration-200 cursor-pointer group"
      id={`source-pill-${index}`}
    >
      <img
        src={favicon}
        alt=""
        width={14}
        height={14}
        className="rounded-sm opacity-70 group-hover:opacity-100 transition-opacity"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <span className="max-w-[120px] truncate">{domain}</span>
      <span className="text-[10px] text-[#606060] ml-0.5">{index + 1}</span>
    </a>
  );
}
