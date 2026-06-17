import { useState } from 'react';
import type { FormEvent } from 'react';
import { useData } from '../context/DataContext';
import { useCelebration } from '../context/CelebrationContext';
import { money, parseAmount } from '../lib/format';
import { sumIncome } from '../lib/calc';

export function IncomePanel() {
  const { monthData, addIncome, updateIncome, deleteIncome } = useData();
  const { celebrate } = useCelebration();
  const { income } = monthData;

  const paycheck = income.find((i) => i.type === 'paycheck') ?? null;
  const others = income.filter((i) => i.type === 'other');

  const [payValue, setPayValue] = useState('');
  const [editingPay, setEditingPay] = useState(false);
  const [otherLabel, setOtherLabel] = useState('');
  const [otherAmount, setOtherAmount] = useState('');

  function submitPaycheck(e: FormEvent) {
    e.preventDefault();
    const amount = parseAmount(payValue);
    if (amount <= 0) return;
    if (paycheck) {
      updateIncome(paycheck.id, { amount });
      setEditingPay(false);
    } else {
      const { firstPaycheck } = addIncome({ type: 'paycheck', label: 'Paycheck', amount });
      if (firstPaycheck) celebrate();
    }
    setPayValue('');
  }

  function submitOther(e: FormEvent) {
    e.preventDefault();
    const amount = parseAmount(otherAmount);
    if (amount <= 0 || !otherLabel.trim()) return;
    addIncome({ type: 'other', label: otherLabel.trim(), amount });
    setOtherLabel('');
    setOtherAmount('');
  }

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Income</h2>
        <span className="chip bg-mint/10 text-mint">{money(sumIncome(income))}</span>
      </div>

      {/* Primary paycheck */}
      <div className="mb-5">
        <div className="label mb-1.5">Monthly net paycheck</div>
        {paycheck && !editingPay ? (
          <div className="flex items-center justify-between rounded-xl bg-ink-700 px-3 py-2.5">
            <span className="text-lg font-bold">{money(paycheck.amount)}</span>
            <div className="flex gap-1">
              <button
                className="btn-icon"
                aria-label="Edit paycheck"
                onClick={() => {
                  setEditingPay(true);
                  setPayValue(String(paycheck.amount));
                }}
              >
                ✎
              </button>
              <button className="btn-icon" aria-label="Delete paycheck" onClick={() => deleteIncome(paycheck.id)}>
                🗑
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submitPaycheck} className="flex gap-2">
            <input
              inputMode="decimal"
              placeholder="0.00"
              className="input"
              value={payValue}
              onChange={(e) => setPayValue(e.target.value)}
              autoFocus={editingPay}
            />
            <button type="submit" className="btn-primary shrink-0">
              {paycheck ? 'Save' : 'Add'}
            </button>
          </form>
        )}
      </div>

      {/* Other income */}
      <div>
        <div className="label mb-1.5">Other income</div>
        <div className="space-y-2">
          {others.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-xl bg-ink-700 px-3 py-2">
              <span className="text-sm text-slate-300">{o.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{money(o.amount)}</span>
                <button className="btn-icon" aria-label="Delete income" onClick={() => deleteIncome(o.id)}>
                  🗑
                </button>
              </div>
            </div>
          ))}
          {others.length === 0 && (
            <p className="text-sm text-slate-500">No other income yet.</p>
          )}
        </div>

        <form onSubmit={submitOther} className="mt-2 flex gap-2">
          <input
            placeholder="Label (e.g. Freelance)"
            className="input"
            value={otherLabel}
            onChange={(e) => setOtherLabel(e.target.value)}
          />
          <input
            inputMode="decimal"
            placeholder="0.00"
            className="input w-28 shrink-0"
            value={otherAmount}
            onChange={(e) => setOtherAmount(e.target.value)}
          />
          <button type="submit" className="btn-ghost shrink-0">
            +
          </button>
        </form>
      </div>
    </section>
  );
}
