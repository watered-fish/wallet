import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useData } from '../context/DataContext';
import { money, parseAmount } from '../lib/format';

const PRESETS = [25, 50, 75];

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { savingsGoalPct, setSavingsGoal, fundingPaycheck } = useData();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) setValue(savingsGoalPct > 0 ? String(savingsGoalPct) : '');
  }, [open, savingsGoalPct]);

  if (!open) return null;

  const preview = Math.max(0, Math.min(100, parseAmount(value)));

  function save(e: FormEvent) {
    e.preventDefault();
    setSavingsGoal(preview);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Settings</h2>
          <button className="btn-icon" aria-label="Close settings" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={save}>
          <div className="label mb-1.5">Savings goal · % of paycheck</div>
          <p className="mb-3 text-xs text-slate-500">
            The share of each paycheck to set aside. It shows as a gold slice on the dashboard
            ring and is kept out of your free-to-spend number. Set 0 to turn it off.
          </p>

          <div className="mb-3 flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setValue(String(p))}
                className={`chip transition ${
                  preview === p ? 'bg-accent text-white' : 'bg-ink-700 text-slate-300 hover:bg-ink-600'
                }`}
              >
                {p}%
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="relative w-full">
              <input
                inputMode="decimal"
                placeholder="0"
                className="input pr-8"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                %
              </span>
            </div>
            <button type="submit" className="btn-primary shrink-0">
              Save
            </button>
          </div>

          {preview > 0 && fundingPaycheck > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              {preview}% of your {money(fundingPaycheck)} paycheck = {money((preview / 100) * fundingPaycheck)} set
              aside each month.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
