interface KpiCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  accent?: string; // tailwind bg color class e.g. "bg-blue-500"
}

export default function KpiCard({ label, value, subLabel, accent = 'bg-blue-500' }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1 shadow-sm">
      <div className={`w-1 h-8 rounded-full ${accent} mb-1`} />
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subLabel && <p className="text-xs text-gray-400">{subLabel}</p>}
    </div>
  );
}
