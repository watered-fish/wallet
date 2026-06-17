import { useData } from '../context/DataContext';
import {
  effectiveExpenses,
  netSavings,
  rentShare,
  savingsRate,
  sumExpenses,
  sumIncome,
} from '../lib/calc';
import { money, percent } from '../lib/format';

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' }) {
  const color = tone === 'pos' ? 'text-mint' : tone === 'neg' ? 'text-coral' : 'text-slate-100';
  return (
    <div className="card p-4">
      <div className="label">{label}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

export function Dashboard() {
  const { monthData } = useData();
  const { income, expenses, rent } = monthData;

  const totalIncome = sumIncome(income);
  const logged = sumExpenses(expenses);
  const caleb = rentShare(rent);
  const spent = effectiveExpenses(expenses, rent);
  const net = netSavings(income, expenses, rent);
  const rate = savingsRate(income, expenses, rent);

  const hasIncome = totalIncome > 0;
  const rateTone = rate >= 0 ? 'pos' : 'neg';
  const ringColor = rate >= 20 ? '#3ddc97' : rate >= 0 ? '#7c5cff' : '#ff6b6b';
  const ringPct = Math.max(0, Math.min(100, rate));

  return (
    <section className="space-y-3">
      <div className="card relative overflow-hidden p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="label">Savings rate · this month</div>
            <div className={`mt-1 text-5xl font-extrabold tracking-tight text-${rateTone === 'pos' ? 'mint' : 'coral'}`}>
              {hasIncome ? percent(rate) : '—'}
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {hasIncome
                ? `${money(net)} kept of ${money(totalIncome)} earned`
                : 'Add a paycheck to see your savings rate.'}
            </p>
          </div>
          <div
            className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(${ringColor} ${ringPct * 3.6}deg, #24242e 0deg)`,
            }}
          >
            <div className="grid h-[78px] w-[78px] place-items-center rounded-full bg-ink-800 text-sm font-bold">
              {hasIncome ? percent(rate) : '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Income" value={money(totalIncome)} tone="pos" />
        <Stat label="Expenses" value={money(spent)} tone="neg" />
        <Stat label="Net saved" value={money(net)} tone={net >= 0 ? 'pos' : 'neg'} />
        <Stat label="Rent (your share)" value={money(caleb)} />
      </div>

      {caleb > 0 && (
        <p className="px-1 text-xs text-slate-500">
          Includes your {money(caleb)} rent share. Logged expenses: {money(logged)}.
        </p>
      )}
    </section>
  );
}
