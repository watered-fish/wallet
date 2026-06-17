import { useMemo, useState } from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useData } from '../context/DataContext';
import { monthDate, dayKeyOf } from '../lib/date';
import { money } from '../lib/format';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function MiniCalendar() {
  const { month, monthData, categories } = useData();
  const [selected, setSelected] = useState<string | null>(null);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const days = useMemo(() => {
    const base = monthDate(month);
    const start = startOfWeek(startOfMonth(base));
    const end = endOfWeek(endOfMonth(base));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, typeof monthData.expenses>();
    for (const ex of monthData.expenses) {
      const list = map.get(ex.date) ?? [];
      list.push(ex);
      map.set(ex.date, list);
    }
    return map;
  }, [monthData.expenses]);

  const selectedItems = selected ? byDay.get(selected) ?? [] : [];

  return (
    <section className="card p-5">
      <h2 className="mb-4 text-base font-semibold">Calendar</h2>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="pb-1 text-[11px] font-medium text-slate-500">
            {d}
          </div>
        ))}

        {days.map((day) => {
          const key = dayKeyOf(day);
          const inMonth = isSameMonth(day, monthDate(month));
          const items = byDay.get(key) ?? [];
          const dots = items.slice(0, 4);
          const isSel = selected === key;
          return (
            <button
              key={key}
              onClick={() => setSelected(items.length ? key : null)}
              className={`flex aspect-square flex-col items-center justify-start rounded-lg p-1 text-xs transition ${
                inMonth ? 'text-slate-300' : 'text-slate-600'
              } ${isSel ? 'bg-ink-600 ring-1 ring-accent/60' : items.length ? 'hover:bg-ink-700' : ''}`}
            >
              <span className={inMonth ? '' : 'opacity-50'}>{format(day, 'd')}</span>
              <span className="mt-0.5 flex flex-wrap items-center justify-center gap-0.5">
                {dots.map((ex) => (
                  <span
                    key={ex.id}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: ex.category_id ? catById.get(ex.category_id)?.color ?? '#9aa0aa' : '#9aa0aa' }}
                  />
                ))}
                {items.length > 4 && <span className="text-[8px] text-slate-500">+{items.length - 4}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {selected && selectedItems.length > 0 && (
        <div className="mt-3 rounded-xl border border-white/5 bg-ink-700 p-3 animate-pop-in">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">{format(new Date(selected), 'EEEE, MMM d')}</span>
            <button className="btn-icon" aria-label="Close" onClick={() => setSelected(null)}>
              ✕
            </button>
          </div>
          <div className="space-y-1.5">
            {selectedItems.map((ex) => {
              const cat = ex.category_id ? catById.get(ex.category_id) : undefined;
              return (
                <div key={ex.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat?.color ?? '#9aa0aa' }}
                  />
                  <span className="flex-1 truncate text-slate-300">
                    {cat?.name ?? 'Uncategorized'}
                    {ex.note ? ` · ${ex.note}` : ''}
                  </span>
                  <span className="font-semibold">{money(ex.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
