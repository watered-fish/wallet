import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  deleteRow,
  flushOutbox,
  insertRow,
  pull,
  updateRow,
} from '../lib/store';
import { pendingCount as outboxCount, writeCache } from '../lib/offline';
import { DEFAULT_CATEGORIES } from '../lib/defaults';
import { carryoverBefore, summarizeMonths } from '../lib/calc';
import type { MonthSummary } from '../lib/calc';
import { currentMonthKey, msUntilNextMonth, shiftMonth } from '../lib/date';
import type {
  Category,
  Expense,
  Income,
  IncomeType,
  MonthData,
  MonthKey,
  Rent,
  RentPayment,
  RoommateName,
} from '../lib/types';

interface DataState {
  ready: boolean;
  online: boolean;
  pending: number;

  categories: Category[];
  month: MonthKey;
  realMonth: MonthKey;
  setMonth: (m: MonthKey) => void;
  goPrevMonth: () => void;
  goNextMonth: () => void;
  monthData: MonthData;
  /** Funds left over from all months before the selected one. */
  carryover: number;
  /** Per-month income/spend/net with a running balance, oldest first. */
  history: MonthSummary[];

  addCategory: (name: string, color: string, cap: number) => void;
  updateCategory: (id: string, patch: Partial<Pick<Category, 'name' | 'color' | 'budget_cap'>>) => void;
  deleteCategory: (id: string) => void;

  addIncome: (input: { type: IncomeType; label: string; amount: number }) => { firstPaycheck: boolean };
  updateIncome: (id: string, patch: Partial<Pick<Income, 'label' | 'amount'>>) => void;
  deleteIncome: (id: string) => void;

  addExpense: (input: { amount: number; category_id: string; date: string; note: string | null }) => void;
  updateExpense: (id: string, patch: Partial<Pick<Expense, 'amount' | 'category_id' | 'date' | 'note'>>) => void;
  deleteExpense: (id: string) => void;

  setRentTotal: (amount: number) => void;
  addRentPayment: (input: { person: RoommateName; amount: number; date: string }) => void;
  deleteRentPayment: (id: string) => void;
}

const DataContext = createContext<DataState | null>(null);

function nowIso(): string {
  return new Date().toISOString();
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [pending, setPending] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rents, setRents] = useState<Rent[]>([]);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);

  const [realMonth, setRealMonth] = useState<MonthKey>(currentMonthKey());
  const [month, setMonth] = useState<MonthKey>(currentMonthKey());

  // --- initial load + realtime + connectivity -----------------------------
  const refreshAll = useCallback(async () => {
    const [c, i, e, r, p] = await Promise.all([
      pull('categories'),
      pull('income'),
      pull('expenses'),
      pull('rent'),
      pull('rent_payments'),
    ]);
    setCategories(c);
    setIncome(i);
    setExpenses(e);
    setRents(r);
    setRentPayments(p);
    return { c, i, e, r, p };
  }, []);

  useEffect(() => {
    if (!session) {
      setReady(false);
      return;
    }
    let cancelled = false;

    (async () => {
      const { c } = await refreshAll();
      if (cancelled) return;

      if (c.length === 0 && navigator.onLine) {
        const seeded: Category[] = DEFAULT_CATEGORIES.map((d) => ({
          id: crypto.randomUUID(),
          name: d.name,
          color: d.color,
          budget_cap: d.budget_cap,
          is_default: true,
          created_at: nowIso(),
        }));
        setCategories(seeded);
        writeCache('categories', seeded);
        await Promise.all(seeded.map((row) => insertRow('categories', row)));
      }

      await flushOutbox();
      setPending(outboxCount());
      setReady(true);
    })();

    const channel = supabase
      .channel('wallet-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        if (navigator.onLine) void refreshAll();
      })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [session, refreshAll]);

  useEffect(() => {
    const goOnline = async () => {
      setOnline(true);
      await flushOutbox();
      setPending(outboxCount());
      await refreshAll();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    const poll = window.setInterval(() => setPending(outboxCount()), 4000);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.clearInterval(poll);
    };
  }, [refreshAll]);

  // --- auto month rollover at midnight on the 1st -------------------------
  const realMonthRef = useRef(realMonth);
  realMonthRef.current = realMonth;
  useEffect(() => {
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        const next = currentMonthKey();
        const prevReal = realMonthRef.current;
        // Only auto-advance the view if the user was on the (old) current month.
        setMonth((cur) => (cur === prevReal ? next : cur));
        setRealMonth(next);
        schedule();
      }, msUntilNextMonth() + 1000);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  // --- derived: data for the selected month -------------------------------
  const monthData = useMemo<MonthData>(
    () => ({
      income: income.filter((i) => i.month === month),
      expenses: expenses.filter((e) => e.month === month),
      rent: rents.find((r) => r.month === month) ?? null,
      rentPayments: rentPayments.filter((p) => p.month === month),
    }),
    [income, expenses, rents, rentPayments, month],
  );

  const history = useMemo(
    () => summarizeMonths(income, expenses, rents),
    [income, expenses, rents],
  );
  const carryover = useMemo(() => carryoverBefore(month, history), [month, history]);

  // --- mutation helpers ---------------------------------------------------
  const persistCategories = (next: Category[]) => {
    setCategories(next);
    writeCache('categories', next);
  };
  const persistIncome = (next: Income[]) => {
    setIncome(next);
    writeCache('income', next);
  };
  const persistExpenses = (next: Expense[]) => {
    setExpenses(next);
    writeCache('expenses', next);
  };
  const persistRents = (next: Rent[]) => {
    setRents(next);
    writeCache('rent', next);
  };
  const persistPayments = (next: RentPayment[]) => {
    setRentPayments(next);
    writeCache('rent_payments', next);
  };

  const bumpPending = () => window.setTimeout(() => setPending(outboxCount()), 50);

  const value = useMemo<DataState>(() => {
    return {
      ready,
      online,
      pending,
      categories,
      month,
      realMonth,
      setMonth,
      goPrevMonth: () => setMonth((m) => shiftMonth(m, -1)),
      goNextMonth: () => setMonth((m) => shiftMonth(m, 1)),
      monthData,
      carryover,
      history,

      addCategory(name, color, cap) {
        const row: Category = {
          id: crypto.randomUUID(),
          name,
          color,
          budget_cap: cap,
          is_default: false,
          created_at: nowIso(),
        };
        persistCategories([...categories, row]);
        void insertRow('categories', row).then(bumpPending);
      },
      updateCategory(id, patch) {
        persistCategories(categories.map((c) => (c.id === id ? { ...c, ...patch } : c)));
        void updateRow('categories', id, patch).then(bumpPending);
      },
      deleteCategory(id) {
        persistCategories(categories.filter((c) => c.id !== id));
        // Keep expenses; orphan them so history is preserved.
        persistExpenses(expenses.map((e) => (e.category_id === id ? { ...e, category_id: null } : e)));
        void deleteRow('categories', id).then(bumpPending);
      },

      addIncome({ type, label, amount }) {
        const firstPaycheck =
          type === 'paycheck' && !income.some((i) => i.month === month && i.type === 'paycheck');
        const row: Income = {
          id: crypto.randomUUID(),
          month,
          type,
          label,
          amount,
          created_at: nowIso(),
        };
        persistIncome([...income, row]);
        void insertRow('income', row).then(bumpPending);
        return { firstPaycheck };
      },
      updateIncome(id, patch) {
        persistIncome(income.map((i) => (i.id === id ? { ...i, ...patch } : i)));
        void updateRow('income', id, patch).then(bumpPending);
      },
      deleteIncome(id) {
        persistIncome(income.filter((i) => i.id !== id));
        void deleteRow('income', id).then(bumpPending);
      },

      addExpense({ amount, category_id, date, note }) {
        const row: Expense = {
          id: crypto.randomUUID(),
          month,
          amount,
          category_id,
          date,
          note,
          created_at: nowIso(),
        };
        persistExpenses([...expenses, row]);
        void insertRow('expenses', row).then(bumpPending);
      },
      updateExpense(id, patch) {
        persistExpenses(expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)));
        void updateRow('expenses', id, patch).then(bumpPending);
      },
      deleteExpense(id) {
        persistExpenses(expenses.filter((e) => e.id !== id));
        void deleteRow('expenses', id).then(bumpPending);
      },

      setRentTotal(amount) {
        const existing = rents.find((r) => r.month === month);
        if (existing) {
          persistRents(rents.map((r) => (r.id === existing.id ? { ...r, total_amount: amount } : r)));
          void updateRow('rent', existing.id, { total_amount: amount }).then(bumpPending);
        } else {
          const row: Rent = {
            id: crypto.randomUUID(),
            month,
            total_amount: amount,
            created_at: nowIso(),
          };
          persistRents([...rents, row]);
          void insertRow('rent', row).then(bumpPending);
        }
      },
      addRentPayment({ person, amount, date }) {
        const row: RentPayment = {
          id: crypto.randomUUID(),
          month,
          person,
          amount,
          date,
          created_at: nowIso(),
        };
        persistPayments([...rentPayments, row]);
        void insertRow('rent_payments', row).then(bumpPending);
      },
      deleteRentPayment(id) {
        persistPayments(rentPayments.filter((p) => p.id !== id));
        void deleteRow('rent_payments', id).then(bumpPending);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, online, pending, categories, income, expenses, rents, rentPayments, month, realMonth, monthData, carryover, history]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
