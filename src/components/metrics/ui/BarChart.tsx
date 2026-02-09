import { MONO } from "../types";

interface BarChartProps {
  items: { label: string; value: number }[];
  color?: string;
  height?: string;
}

export default function BarChart({
  items,
  color = "#4f46e5",
  height = "h-44",
}: BarChartProps) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className={`flex items-end gap-1.5 ${height}`}>
      {items.map((item, i) => {
        const h = (item.value / max) * 100;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 min-w-0"
          >
            <span
              className={`${MONO} text-[10px] text-gray-500 truncate w-full text-center`}
            >
              {item.value > 0 ? item.value : ""}
            </span>
            <div
              className="w-full rounded-t-md transition-all duration-700 ease-out"
              style={{
                height: `${Math.max(h, 2)}%`,
                background: `linear-gradient(to top, ${color}, ${color}aa)`,
              }}
            />
            <span
              className={`${MONO} text-[9px] text-gray-400 truncate w-full text-center`}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
