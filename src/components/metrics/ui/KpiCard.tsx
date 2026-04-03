import { MONO, fmt } from "../types";

interface KpiCardProps {
  label: string;
  value: number;
  sub?: string;
  icon?: React.ReactNode;
}

export default function KpiCard({ label, value, sub, icon }: KpiCardProps) {
  return (
    <div className="bg-[#161920] rounded-xl p-5 border border-white/[0.08] hover:border-white/[0.12] transition-colors">
      <div className="flex items-start justify-between">
        <p
          className={`${MONO} text-[11px] tracking-wider uppercase text-gray-500 mb-2`}
        >
          {label}
        </p>
        {icon && <span className="text-gray-600">{icon}</span>}
      </div>
      <p className={`${MONO} text-3xl font-semibold text-gray-100`}>
        {fmt(value)}
      </p>
      {sub && (
        <p className={`${MONO} text-xs text-gray-500 mt-1`}>{sub}</p>
      )}
    </div>
  );
}
