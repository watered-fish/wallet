import { useData } from '../context/DataContext';
import {
  effectiveExpenses,
  netSavings,
  rentShare,
  savingsRate,
  sumExpenses,
  sumIncome,
} from '../lib/calc';
import { daysLeftInMonth, isCurrentMonth } from '../lib/date';
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
  const { monthData, carryover, month } = useData();
  const { income, expenses, rent } = monthData;

  const totalIncome = sumIncome(income);
  const logged = sumExpenses(expenses);
  const caleb = rentShare(rent);
  const spent = effectiveExpenses(expenses, rent);
  const net = netSavings(income, expenses, rent);
  const rate = savingsRate(income, expenses, rent);

  // Paychecks land at the end of a month, so a fresh month runs on last
  // month's leftover. "Available" is what's actually in the wallet right now.
  const fundsIn = carryover + totalIncome;
  const available = fundsIn - spent;
  const pctLeft = fundsIn > 0 ? (available / fundsIn) * 100 : 0;

  const viewingNow = isCurrentMonth(month);
  const daysLeft = daysLeftInMonth();
  const perDay = viewingNow && available > 0 && totalIncome === 0 ? available / daysLeft : null;

  const hasFunds = fundsIn > 0;
  const availTone = available >= 0 ? 'pos' : 'neg';
  const ringColor = pctLeft >= 50 ? '#3ddc97' : pctLeft >= 20 ? '#7c5cff' : '#ff6b6b';
  const ringPct = Math.max(0, Math.min(100, pctLeft));

  return (
    <section className="space-y-3">
      <div className="card relative overflow-hidden p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="label">Available to spend</div>
            <div className={`mt-1 text-5xl font-extrabold tracking-tight ${availTone === 'pos' ? 'text-mint' : 'text-coral'}`}>
              {hasFunds ? money(available) : '—'}
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {hasFunds
                ? `${money(carryover)} carried in + ${money(totalIncome)} earned − ${money(spent)} spent`
                : 'Add a paycheck to get started.'}
            </p>
            {perDay !== null && (
              <p className="mt-1 text-xs text-slate-500">
                ≈ {money(perDay)}/day for the next {daysLeft} day{daysLeft === 1 ? '' : 's'} until payday
              </p>
            )}
          </div>
          <div
            className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(${ringColor} ${ringPct * 3.6}deg, #24242e 0deg)`,
            }}
          >
            <div className="grid h-[78px] w-[78px] place-items-center rounded-full bg-ink-800 text-center text-sm font-bold leading-tight">
              {hasFunds ? (
                <span>
                  {percent(pctLeft)}
                  <span className="block text-[9px] font-medium text-slate-500">left</span>
                </span>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Carried in" value={money(carryover)} tone={carryover >= 0 ? 'pos' : 'neg'} />
        <Stat label="Income · this month" value={money(totalIncome)} tone="pos" />
        <Stat label="Spent · this month" value={money(spent)} tone="neg" />
        <Stat label="Net · this month" value={money(net)} tone={net >= 0 ? 'pos' : 'neg'} />
      </div>

      <p className="px-1 text-xs text-slate-500">
        {caleb > 0 && (
          <>Includes your {money(caleb)} rent share. Logged expenses: {money(logged)}. </>
        )}
        {totalIncome > 0 && <>Savings rate this month: {percent(rate)}.</>}
      </p>
    </section>
  );
}
