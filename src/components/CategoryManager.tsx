import { useState } from 'react';
import type { FormEvent } from 'react';
import { useData } from '../context/DataContext';
import { categorySpent } from '../lib/calc';
import { money, parseAmount } from '../lib/format';
import { CATEGORY_PALETTE } from '../lib/defaults';

export function CategoryManager() {
  const { categories, monthData, addCategory, updateCategory, deleteCategory } = useData();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_PALETTE[0] ?? '#7c5cff');
  const [cap, setCap] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editCap, setEditCap] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addCategory(name.trim(), color, parseAmount(cap));
    setName('');
    setCap('');
    setColor(CATEGORY_PALETTE[0] ?? '#7c5cff');
    setAdding(false);
  }

  function saveCap(id: string) {
    updateCategory(id, { budget_cap: parseAmount(editCap) });
    setEditId(null);
  }

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Categories</h2>
        <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : '+ New'}
        </button>
      </div>

      {adding && (
        <form onSubmit={submit} className="mb-4 space-y-2 rounded-xl bg-ink-700 p-3">
          <input
            placeholder="Category name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <input
              inputMode="decimal"
              placeholder="Budget cap"
              className="input"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
            />
            <button type="submit" className="btn-primary shrink-0">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {CATEGORY_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full transition ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-700' : ''}`}
                style={{ backgroundColor: c }}
                aria-label={`Pick color ${c}`}
              />
            ))}
          </div>
        </form>
      )}

      <div className="space-y-3">
        {categories.map((cat) => {
          const spent = categorySpent(monthData.expenses, cat.id);
          const cap2 = cat.budget_cap;
          const pct = cap2 > 0 ? Math.min(100, (spent / cap2) * 100) : 0;
          const over = cap2 > 0 && spent > cap2;
          return (
            <div key={cat.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-medium">{cat.name}</span>
                </span>
                <span className="flex items-center gap-2">
                  {editId === cat.id ? (
                    <>
                      <input
                        inputMode="decimal"
                        className="input h-7 w-24 py-1 text-right text-xs"
                        value={editCap}
                        onChange={(e) => setEditCap(e.target.value)}
                        autoFocus
                      />
                      <button className="btn-icon" aria-label="Save cap" onClick={() => saveCap(cat.id)}>
                        ✓
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={over ? 'text-coral' : 'text-slate-400'}>
                        {money(spent)} / {money(cap2)}
                      </span>
                      <button
                        className="btn-icon"
                        aria-label="Edit cap"
                        onClick={() => {
                          setEditId(cat.id);
                          setEditCap(String(cat.budget_cap));
                        }}
                      >
                        ✎
                      </button>
                      <button className="btn-icon" aria-label="Delete category" onClick={() => deleteCategory(cat.id)}>
                        🗑
                      </button>
                    </>
                  )}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink-600">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: over ? '#ff6b6b' : cat.color }}
                />
              </div>
            </div>
          );
        })}
        {categories.length === 0 && <p className="text-sm text-slate-500">No categories.</p>}
      </div>
    </section>
  );
}
