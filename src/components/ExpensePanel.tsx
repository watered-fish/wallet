import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useData } from '../context/DataContext';
import { money, parseAmount } from '../lib/format';
import { today } from '../lib/date';
import { format, parseISO } from 'date-fns';

export function ExpensePanel() {
  const { categories, monthData, month, addExpense, updateExpense, deleteExpense } = useData();
  const { expenses } = monthData;

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(defaultDate(month));
  const [note, setNote] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const sorted = useMemo(
    () => [...expenses].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [expenses],
  );

  const effectiveCat = categoryId || categories[0]?.id || '';

  function reset() {
    setAmount('');
    setNote('');
    setDate(defaultDate(month));
    setEditId(null);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = parseAmount(amount);
    if (value <= 0 || !effectiveCat) return;
    const payload = { amount: value, category_id: effectiveCat, date, note: note.trim() || null };
    if (editId) updateExpense(editId, payload);
    else addExpense(payload);
    reset();
  }

  function startEdit(id: string) {
    const ex = expenses.find((e) => e.id === id);
    if (!ex) return;
    setEditId(id);
    setAmount(String(ex.amount));
    setCategoryId(ex.category_id ?? '');
    setDate(ex.date);
    setNote(ex.note ?? '');
  }

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Expenses</h2>
        <span className="text-xs text-slate-500">{expenses.length} this month</span>
      </div>

      <form onSubmit={submit} className="mb-4 grid grid-cols-2 gap-2">
        <input
          inputMode="decimal"
          placeholder="Amount"
          className="input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select className="input" value={effectiveCat} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        <input
          placeholder="Note (optional)"
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="col-span-2 flex gap-2">
          <button type="submit" className="btn-primary flex-1">
            {editId ? 'Save changes' : 'Add expense'}
          </button>
          {editId && (
            <button type="button" className="btn-ghost" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-1.5">
        {sorted.map((ex) => {
          const cat = ex.category_id ? catById.get(ex.category_id) : undefined;
          return (
            <div key={ex.id} className="flex items-center gap-3 rounded-xl bg-ink-700 px-3 py-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cat?.color ?? '#9aa0aa' }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium">{cat?.name ?? 'Uncategorized'}</span>
                  <span className="text-sm font-semibold">{money(ex.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">{ex.note || '—'}</span>
                  <span className="shrink-0 pl-2">{format(parseISO(ex.date), 'MMM d')}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <button className="btn-icon" aria-label="Edit expense" onClick={() => startEdit(ex.id)}>
                  ✎
                </button>
                <button className="btn-icon" aria-label="Delete expense" onClick={() => deleteExpense(ex.id)}>
                  🗑
                </button>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && <p className="text-sm text-slate-500">No expenses logged.</p>}
      </div>
    </section>
  );
}

function defaultDate(month: string): string {
  // If viewing the current month, default to today; otherwise the 1st of that month.
  const t = today();
  return t.startsWith(month) ? t : `${month}-01`;
}
