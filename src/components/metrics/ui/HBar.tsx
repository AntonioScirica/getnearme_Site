import { MONO, fmt } from "../types";

interface HBarProps {
  items: { label: string; value: number; sub?: string }[];
  color?: string;
}

export default function HBar({
  items,
  color = "bg-indigo-500",
}: HBarProps) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const w = (item.value / max) * 100;
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400 truncate mr-2">
                {item.label}
              </span>
              <span className={`${MONO} text-xs font-medium text-gray-200 shrink-0`}>
                {fmt(item.value)}
                {item.sub && (
                  <span className="text-gray-500 ml-1">{item.sub}</span>
                )}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
                style={{ width: `${Math.max(w, 1)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
