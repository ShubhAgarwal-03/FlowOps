import { ReactNode } from 'react';

export function KpiCard({
  label,
  value,
  icon,
  accent = 'slate',
  sublabel,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: 'slate' | 'green' | 'amber' | 'red' | 'indigo';
  sublabel?: string;
}) {
  const borders: Record<string, string> = {
    slate: 'border-l-slate-300',
    green: 'border-l-green-500',
    amber: 'border-l-amber-500',
    red: 'border-l-red-500',
    indigo: 'border-l-indigo-500',
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 ${borders[accent]} p-4`}>
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wide">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-800">{value}</div>
      {sublabel && <div className="mt-1 text-xs text-slate-400">{sublabel}</div>}
    </div>
  );
}