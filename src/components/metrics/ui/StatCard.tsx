import { MONO } from "../types";

interface StatCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function StatCard({ title, children, className }: StatCardProps) {
  return (
    <div
      className={`bg-[#161920] rounded-xl border border-white/[0.08] p-6 ${className || ""}`}
    >
      <h3
        className={`${MONO} text-[11px] tracking-wider uppercase text-gray-500 mb-4 pb-3 border-b border-white/[0.06]`}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export function StatLine({
  label,
  value,
  warn,
}: {
  label: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span
        className={`${MONO} text-sm font-medium ${warn ? "text-red-400" : "text-gray-100"}`}
      >
        {value}
      </span>
    </div>
  );
}
