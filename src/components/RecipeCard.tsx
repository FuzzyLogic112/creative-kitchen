import type { MatchResult } from '../lib/types';
import { CATEGORY_LABELS } from '../lib/matcher';

export function RecipeCard({ r, onClick }: { r: MatchResult; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="press flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="truncate text-[17px] font-semibold text-label">{r.name}</h3>
          <span className="shrink-0 text-[12px] text-label3">
            {CATEGORY_LABELS[r.category] ?? r.category}
            {r.difficulty ? ' · ' + '★'.repeat(r.difficulty) : ''}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {r.got.map((g) => (
            <span key={g} className="rounded-md bg-green-soft px-2 py-0.5 text-[12px] font-medium text-green">
              {g}
            </span>
          ))}
          {r.missing.map((m) => (
            <span key={m} className="rounded-md bg-accent-soft px-2 py-0.5 text-[12px] font-medium text-accent">
              差 {m}
            </span>
          ))}
        </div>
      </div>
      <span className="shrink-0 text-[20px] font-light text-label3">›</span>
    </button>
  );
}
