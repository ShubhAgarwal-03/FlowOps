const COLORS: Record<string, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  CONFIRMED: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  CANCELLED: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  LEAD: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  ACTIVE: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  INACTIVE: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  IN_STOCK: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  LOW_STOCK: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${COLORS[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {label ?? status}
    </span>
  );
}