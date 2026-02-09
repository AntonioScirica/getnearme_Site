import { MONO } from "../types";

interface StatCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function StatCard({ title, children, className }: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className || ""}`}
    >
      <h3
        className={`${MONO} text-[11px] tracking-wider uppercase text-gray-400 mb-4 pb-3 border-b border-gray-100`}
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
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`${MONO} text-sm font-medium ${warn ? "text-red-500" : "text-gray-900"}`}
      >
        {value}
      </span>
    </div>
  );
}
