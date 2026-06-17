import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useData } from '../context/DataContext';
import { useCelebration } from '../context/CelebrationContext';
import { ROOMMATES } from '../lib/types';
import type { RoommateName } from '../lib/types';
import { allRoommatesPaid, isPersonPaid, paidByPerson, rentShare } from '../lib/calc';
import { money, parseAmount } from '../lib/format';
import { today } from '../lib/date';

export function RentTracker() {
  const { month, monthData, setRentTotal, addRentPayment, deleteRentPayment } = useData();
  const { celebrate } = useCelebration();
  const { rent, rentPayments } = monthData;

  const [total, setTotal] = useState('');
  const share = rentShare(rent);
  const allPaid = share > 0 && allRoommatesPaid(rentPayments, share);

  const prevAllPaid = useRef(false);
  useEffect(() => {
    if (allPaid && !prevAllPaid.current) celebrate();
    prevAllPaid.current = allPaid;
  }, [allPaid, celebrate, month]);

  // Reset the celebration latch when switching months.
  useEffect(() => {
    prevAllPaid.current = share > 0 && allRoommatesPaid(rentPayments, share);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  function submitTotal(e: FormEvent) {
    e.preventDefault();
    const amount = parseAmount(total);
    if (amount < 0) return;
    setRentTotal(amount);
    setTotal('');
  }

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Rent split</h2>
        {rent && <span className="chip bg-accent/10 text-accent-soft">{money(share)} each</span>}
      </div>

      <form onSubmit={submitTotal} className="mb-4 flex gap-2">
        <input
          inputMode="decimal"
          placeholder={rent ? `Total: ${money(rent.total_amount)}` : 'Total rent this month'}
          className="input"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0">
          {rent ? 'Update' : 'Set'}
        </button>
      </form>

      {rent && (
        <div className="grid gap-3 sm:grid-cols-3">
          {ROOMMATES.map((person) => (
            <PersonCard
              key={person}
              person={person}
              share={share}
              paid={paidByPerson(rentPayments, person)}
              done={isPersonPaid(rentPayments, person, share)}
              payments={rentPayments.filter((p) => p.person === person)}
              onPay={(amount, date) => addRentPayment({ person, amount, date })}
              onRemove={(id) => deleteRentPayment(id)}
            />
          ))}
        </div>
      )}

      {rent && (
        <p className="mt-3 text-xs text-slate-500">
          Your share ({money(share)}) is automatically deducted from this month's budget. Rich's and
          Bella's shares are not.
        </p>
      )}
    </section>
  );
}

interface PersonCardProps {
  person: RoommateName;
  share: number;
  paid: number;
  done: boolean;
  payments: { id: string; amount: number; date: string }[];
  onPay: (amount: number, date: string) => void;
  onRemove: (id: string) => void;
}

function PersonCard({ person, share, paid, done, payments, onPay, onRemove }: PersonCardProps) {
  const [amount, setAmount] = useState('');
  const [open, setOpen] = useState(false);
  const pct = share > 0 ? Math.min(100, (paid / share) * 100) : 0;
  const remaining = Math.max(0, share - paid);

  function pay(e: FormEvent) {
    e.preventDefault();
    const value = parseAmount(amount);
    if (value <= 0) return;
    onPay(value, today());
    setAmount('');
  }

  return (
    <div
      className={`rounded-xl border p-3 transition ${
        done ? 'border-mint/40 bg-mint/10' : 'border-white/5 bg-ink-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold">{person}</span>
        {done ? (
          <span className="chip bg-mint/20 text-mint">Paid ✓</span>
        ) : (
          <span className="text-xs text-slate-400">{money(remaining)} left</span>
        )}
      </div>

      <div className="my-2 h-2 w-full overflow-hidden rounded-full bg-ink-600">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: done ? '#3ddc97' : '#7c5cff' }}
        />
      </div>
      <div className="text-xs text-slate-400">
        {money(paid)} / {money(share)}
      </div>

      {!done && (
        <form onSubmit={pay} className="mt-2 flex gap-1.5">
          <input
            inputMode="decimal"
            placeholder="Payment"
            className="input h-8 py-1 text-xs"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button type="submit" className="btn-ghost h-8 shrink-0 px-3 py-1 text-xs">
            Log
          </button>
        </form>
      )}

      {payments.length > 0 && (
        <div className="mt-2">
          <button className="text-[11px] text-slate-500 hover:text-slate-300" onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide' : `${payments.length} payment${payments.length > 1 ? 's' : ''}`}
          </button>
          {open && (
            <div className="mt-1 space-y-1">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{money(p.amount)}</span>
                  <button className="hover:text-coral" onClick={() => onRemove(p.id)} aria-label="Remove payment">
                    remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
