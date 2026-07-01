import { useData } from '../context/DataContext';
import { monthLabel } from '../lib/date';
import { money } from '../lib/format';

export function MonthHistory() {
  const { history, month, setMonth } = useData();
  const latest = history[history.length - 1];
  if (!latest) return null;

  const rows = [...history].reverse();

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">History</h2>
        <span className="chip bg-accent-soft/10 text-accent-soft">
          Balance {money(latest.balance)}
        </span>
      </div>

      <div className="space-y-1">
        <div className="grid grid-cols-4 gap-2 px-2 pb-1 text-right text-[11px] uppercase tracking-wide text-slate-500">
          <span className="text-left">Month</span>
          <span>In</span>
          <span>Out</span>
          <span>Balance</span>
        </div>
        {rows.map((s) => (
          <button
            key={s.month}
            onClick={() => setMonth(s.month)}
            className={`grid w-full grid-cols-4 gap-2 rounded-xl px-2 py-2 text-right text-sm transition hover:bg-ink-700 ${
              s.month === month ? 'bg-ink-700' : ''
            }`}
          >
            <span className="text-left font-medium text-slate-300">{monthLabel(s.month)}</span>
            <span className="text-mint">{money(s.income)}</span>
            <span className="text-coral">{money(s.spent)}</span>
            <span className={`font-semibold ${s.balance >= 0 ? 'text-slate-100' : 'text-coral'}`}>
              {money(s.balance)}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Balance rolls forward month to month — an end-of-month paycheck shows up as next month's
        “carried in”.
      </p>
    </section>
  );
}
