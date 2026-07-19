const TONES: Record<string, string> = {
  teal: "#0069B4",
  green: "#8DC63F",
  amber: "#C77700",
  coral: "#D3365F",
};

export function Sparkline({
  data,
  tone = "teal",
  width = 140,
  height = 40,
}: {
  data: number[];
  tone?: string;
  width?: number;
  height?: number;
}) {
  const color = TONES[tone] ?? TONES.teal;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => [i * step, height - 4 - ((v - min) / range) * (height - 8)]);
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  const gid = `sg-${tone}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r="3"
        fill={color}
        className="animate-pulse-soft"
      />
    </svg>
  );
}
