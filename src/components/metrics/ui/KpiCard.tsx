import { MONO, fmt } from "../types";

interface KpiCardProps {
  label: string;
  value: number;
  sub?: string;
  icon?: React.ReactNode;
}

export default function KpiCard({ label, value, sub, icon }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <p
          className={`${MONO} text-[11px] tracking-wider uppercase text-gray-400 mb-2`}
        >
          {label}
        </p>
        {icon && <span className="text-gray-300">{icon}</span>}
      </div>
      <p className={`${MONO} text-3xl font-semibold text-gray-900`}>
        {fmt(value)}
      </p>
      {sub && (
        <p className={`${MONO} text-xs text-gray-400 mt-1`}>{sub}</p>
      )}
    </div>
  );
}
