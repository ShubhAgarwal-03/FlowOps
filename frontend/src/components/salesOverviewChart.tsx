import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { formatCurrency } from '../lib/format';

interface Point { date: string; label: string; total: number }

export function SalesOverviewChart({ data }: { data: Point[] }) {
  const peak = Math.max(...data.map((d) => d.total), 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800 text-sm">Sales Overview</h2>
        <span className="text-xs text-slate-400">Last 7 days</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value: number) => [formatCurrency(value), 'Value']} labelStyle={{ color: '#334155' }} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.total === peak && peak > 0 ? '#4f46e5' : '#c7d2fe'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}