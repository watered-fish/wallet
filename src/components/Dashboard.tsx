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

const GOLD = '#ffd166';
const MINT = '#3ddc97';
const TRACK = '#24242e';

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
  const { monthData, carryover, month, savingsGoalPct, fundingPaycheck } = useData();
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

  // Savings goal: a share of the funding paycheck is set aside (gold) and
  // excluded from the free-to-spend number.
  const goalTarget = savingsGoalPct > 0 ? (savingsGoalPct / 100) * fundingPaycheck : 0;
  const hasGoal = goalTarget > 0;
  const reserved = Math.min(goalTarget, Math.max(available, 0));
  const free = Math.max(available - reserved, 0);
  const behindBy = hasGoal ? goalTarget - Math.max(available, 0) : 0;

  const viewingNow = isCurrentMonth(month);
  const daysLeft = daysLeftInMonth();
  const spendable = hasGoal ? free : available;
  const perDay = viewingNow && spendable > 0 && totalIncome === 0 ? spendable / daysLeft : null;

  const hasFunds = fundsIn > 0;
  const availTone = available >= 0 ? 'pos' : 'neg';

  const ringPct = Math.max(0, Math.min(100, pctLeft));
  const singleColor = ringPct >= 50 ? MINT : ringPct >= 20 ? '#7c5cff' : '#ff6b6b';
  const freeDeg = hasFunds ? Math.max(0, (free / fundsIn) * 360) : 0;
  const reservedDeg = hasFunds ? Math.max(0, (reserved / fundsIn) * 360) : 0;
  const ringBackground = hasGoal
    ? `conic-gradient(${MINT} 0deg ${freeDeg}deg, ${GOLD} ${freeDeg}deg ${freeDeg + reservedDeg}deg, ${TRACK} ${freeDeg + reservedDeg}deg 360deg)`
    : `conic-gradient(${singleColor} ${ringPct * 3.6}deg, ${TRACK} 0deg)`;

  return (
    <section className="space-y-3">
      <div className="card relative overflow-hidden p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="label">{hasGoal ? 'Free to spend' : 'Available to spend'}</div>
            <div className={`mt-1 text-5xl font-extrabold tracking-tight ${availTone === 'pos' ? 'text-mint' : 'text-coral'}`}>
              {hasFunds ? money(hasGoal ? free : available) : '—'}
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {hasFunds
                ? `${money(carryover)} carried in + ${money(totalIncome)} earned − ${money(spent)} spent`
                : 'Add a paycheck to get started.'}
            </p>
            {hasGoal && hasFunds && (
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: GOLD }} />
                  Goal {percent(savingsGoalPct)} · {money(reserved)} set aside
                </span>
                {behindBy > 0 && (
                  <span className="text-coral">{money(behindBy)} short of goal</span>
                )}
              </p>
            )}
            {perDay !== null && (
              <p className="mt-1 text-xs text-slate-500">
                ≈ {money(perDay)}/day for the next {daysLeft} day{daysLeft === 1 ? '' : 's'} until payday
              </p>
            )}
          </div>
          <div
            className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full"
            style={{ background: ringBackground }}
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
