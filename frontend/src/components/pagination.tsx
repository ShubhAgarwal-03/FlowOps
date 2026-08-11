export function Pagination({
  page,
  total,
  limit,
  onChange,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);

  return (
    <div className="flex items-center justify-between text-sm text-slate-500 mt-3">
      <span>
        Showing {start}–{end} of {total}
      </span>
      <div className="flex gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .slice(0, 5)
          .map((p) => (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`px-3 py-1 rounded border text-xs ${
                p === page ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
}