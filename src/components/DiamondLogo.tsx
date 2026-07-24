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
              "conic-gradient(from 0deg, transparent 0%, rgba(0,105,180,0.5) 12%, transparent 28%, transparent 60%, rgba(141,198,63,0.35) 72%, transparent 88%)",
            filter: "blur(3px)",
          }}
        />
      </div>
      {/* Fibabanka elması: sol yüzler mavi, sağ yüzler yeşil, dört facetli */}
      <svg viewBox="0 0 48 48" width={size} height={size} className="relative drop-shadow-[0_0_8px_rgba(0,105,180,0.45)]">
        <defs>
          <linearGradient id="fibaBlueTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0A79C4" />
            <stop offset="100%" stopColor="#0069B4" />
          </linearGradient>
          <linearGradient id="fibaBlueBottom" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0069B4" />
            <stop offset="100%" stopColor="#004E86" />
          </linearGradient>
          <linearGradient id="fibaGreenTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A6D651" />
            <stop offset="100%" stopColor="#7AB929" />
          </linearGradient>
          <linearGradient id="fibaGreenBottom" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7AB929" />
            <stop offset="100%" stopColor="#568D12" />
          </linearGradient>
        </defs>
        <polygon points="4,24 24,4 24,24" fill="url(#fibaBlueTop)" />
        <polygon points="4,24 24,24 24,44" fill="url(#fibaBlueBottom)" />
        <polygon points="24,4 44,24 24,24" fill="url(#fibaGreenTop)" />
        <polygon points="24,24 44,24 24,44" fill="url(#fibaGreenBottom)" />
        {/* Facet ayrım çizgileri — kesim hissi */}
        <path d="M24 4 L24 44 M4 24 L44 24" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.8" />
      </svg>
    </div>
  );
}
