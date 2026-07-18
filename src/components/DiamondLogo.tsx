import { cn } from "../lib/utils";

export function DiamondLogo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      {/* Yavaş dönen glow halkası */}
      <div className="absolute inset-[-6px] animate-spin-slow rounded-full">
        <div
          className="absolute inset-0 rounded-full opacity-60"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, rgba(47,182,166,0.5) 12%, transparent 28%, transparent 60%, rgba(141,198,63,0.35) 72%, transparent 88%)",
            filter: "blur(3px)",
          }}
        />
      </div>
      <svg viewBox="0 0 48 48" width={size} height={size} className="relative">
        <defs>
          <linearGradient id="dg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2FB6A6" />
            <stop offset="55%" stopColor="#4FD8C7" />
            <stop offset="100%" stopColor="#8DC63F" />
          </linearGradient>
        </defs>
        <rect
          x="12"
          y="12"
          width="24"
          height="24"
          rx="4"
          transform="rotate(45 24 24)"
          fill="url(#dg)"
          className="drop-shadow-[0_0_8px_rgba(47,182,166,0.6)]"
        />
        <rect
          x="18"
          y="18"
          width="12"
          height="12"
          rx="2"
          transform="rotate(45 24 24)"
          fill="#071B36"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}
