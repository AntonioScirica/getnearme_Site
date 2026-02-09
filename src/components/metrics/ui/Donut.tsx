import { MONO, pct } from "../types";

interface DonutProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}

const PALETTE = ["#4f46e5", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

export default function Donut({ segments, size = 80 }: DonutProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <p className={`${MONO} text-xs text-gray-400`}>No data</p>
    );
  }

  let cumulative = 0;
  const stops = segments.map((seg, i) => {
    const start = cumulative;
    cumulative += (seg.value / total) * 360;
    return `${seg.color || PALETTE[i % PALETTE.length]} ${start}deg ${cumulative}deg`;
  });

  const gradient = `conic-gradient(${stops.join(", ")})`;

  return (
    <div className="flex items-center gap-6">
      <div
        className="rounded-full shrink-0"
        style={{
          width: size,
          height: size,
          background: gradient,
          mask: "radial-gradient(circle at center, transparent 55%, black 56%)",
          WebkitMask:
            "radial-gradient(circle at center, transparent 55%, black 56%)",
        }}
      />
      <div className="space-y-1.5 min-w-0">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: seg.color || PALETTE[i % PALETTE.length] }}
            />
            <span className="text-sm text-gray-600 truncate">{seg.label}</span>
            <span className={`${MONO} text-xs text-gray-400 shrink-0`}>
              {pct(seg.value, total)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
