import { useId } from "react";

const SIZE = {
  sm: {
    box: "h-7 w-7 rounded-[9px]",
    icon: "h-4 w-4",
  },
  md: {
    box: "h-8 w-8 rounded-[10px]",
    icon: "h-[18px] w-[18px]",
  },
  lg: {
    box: "h-10 w-10 rounded-xl",
    icon: "h-5 w-5",
  },
};

const ChatProMark = ({ gradientId, className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={gradientId} x1="4" y1="4" x2="20" y2="20">
        <stop stopColor="#93C5FD" />
        <stop offset="1" stopColor="#38BDF8" />
      </linearGradient>
    </defs>

    <path
      d="M7 6.5h10a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-2.5 2.5H11l-2.2 2.2V16.5H7a2.5 2.5 0 0 1-2.5-2.5V9a2.5 2.5 0 0 1 2.5-2.5Z"
      fill={`url(#${gradientId})`}
      fillOpacity="0.16"
      stroke={`url(#${gradientId})`}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 10h7M8.5 12.25h4.5"
      stroke={`url(#${gradientId})`}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="16.75" cy="8.25" r="1.15" fill="#38BDF8" />
  </svg>
);

const AppLogo = ({ size = "md" }) => {
  const gradientId = useId();
  const { box, icon } = SIZE[size] ?? SIZE.md;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center border border-slate-700/50 bg-gradient-to-br from-slate-950 via-[#0b1220] to-slate-900 shadow-sm shadow-black/30 ring-1 ring-inset ring-white/5 ${box}`}
      role="img"
      aria-label="ChatPro"
    >
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.12),transparent_55%)]" />
      <ChatProMark gradientId={gradientId} className={`relative ${icon}`} />
    </div>
  );
};

export default AppLogo;
