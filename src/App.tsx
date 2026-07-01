import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { CelebrationProvider } from './context/CelebrationContext';
import { supabaseConfigured } from './lib/supabase';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { IncomePanel } from './components/IncomePanel';
import { ExpensePanel } from './components/ExpensePanel';
import { CategoryManager } from './components/CategoryManager';
import { MiniCalendar } from './components/MiniCalendar';
import { MonthHistory } from './components/MonthHistory';
import { RentTracker } from './components/RentTracker';
import { monthLabel } from './lib/date';

function Header() {
  const { month, realMonth, setMonth, goPrevMonth, goNextMonth, online, pending } = useData();
  const { signOut } = useAuth();
  const viewingNow = month === realMonth;

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">👛</span>
          <span className="hidden text-sm font-bold tracking-tight sm:inline">Wallet</span>
        </div>

        <div className="flex items-center gap-1">
          <button className="btn-icon" aria-label="Previous month" onClick={goPrevMonth}>
            ‹
          </button>
          <button
            className="min-w-[7rem] rounded-lg px-2 py-1 text-center text-sm font-semibold hover:bg-ink-700"
            onClick={() => setMonth(realMonth)}
            title="Jump to current month"
          >
            {monthLabel(month)}
          </button>
          <button className="btn-icon" aria-label="Next month" onClick={goNextMonth}>
            ›
          </button>
          {!viewingNow && (
            <button className="ml-1 rounded-lg bg-ink-700 px-2 py-1 text-xs text-slate-300 hover:bg-ink-600" onClick={() => setMonth(realMonth)}>
              Today
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 text-xs ${online ? 'text-slate-500' : 'text-amber-400'}`}
            title={pending > 0 ? `${pending} change(s) waiting to sync` : online ? 'Synced' : 'Offline'}
          >
            <span className={`h-2 w-2 rounded-full ${online ? 'bg-mint' : 'bg-amber-400'}`} />
            {online ? (pending > 0 ? `Syncing ${pending}` : 'Synced') : 'Offline'}
          </span>
          <button className="btn-icon" aria-label="Sign out" onClick={() => void signOut()} title="Sign out">
            ⎋
          </button>
        </div>
      </div>
    </header>
  );
}

function Shell() {
  const { ready, month } = useData();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <div className="animate-pulse text-sm">Loading your wallet…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <Dashboard />
          </div>
          <IncomePanel />
          <CategoryManager />
          <ExpensePanel />
          <MiniCalendar />
          <div className="lg:col-span-2">
            <RentTracker />
          </div>
          <div className="lg:col-span-2">
            <MonthHistory />
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-600">Wallet · USD · {monthLabel(month)}</p>
      </main>
    </div>
  );
}

function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md p-6">
        <h1 className="mb-2 text-lg font-bold">Almost there</h1>
        <p className="mb-3 text-sm text-slate-400">
          Wallet needs your Supabase credentials. Create a <code className="text-accent-soft">.env.local</code> file in
          the project root with:
        </p>
        <pre className="overflow-x-auto rounded-xl bg-ink-700 p-3 text-xs text-slate-300">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
        <p className="mt-3 text-xs text-slate-500">
          See <code className="text-accent-soft">README.md</code> for the full setup (SQL schema + RLS) and restart the
          dev server after adding them.
        </p>
      </div>
    </div>
  );
}

function Gate() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <div className="animate-pulse text-sm">Loading…</div>
      </div>
    );
  }
  if (!session) return <Login />;
  return (
    <DataProvider>
      <CelebrationProvider>
        <Shell />
      </CelebrationProvider>
    </DataProvider>
  );
}

export default function App() {
  if (!supabaseConfigured) return <SetupNotice />;
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
