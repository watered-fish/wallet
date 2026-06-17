import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { MoneyRain } from '../components/MoneyRain';

interface CelebrationState {
  celebrate: () => void;
}

const CelebrationContext = createContext<CelebrationState | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);

  const celebrate = useCallback(() => {
    setActive(false);
    // Next tick so re-triggering mid-animation restarts cleanly.
    window.setTimeout(() => setActive(true), 10);
  }, []);

  const value = useMemo(() => ({ celebrate }), [celebrate]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <MoneyRain active={active} onDone={() => setActive(false)} />
    </CelebrationContext.Provider>
  );
}

export function useCelebration(): CelebrationState {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error('useCelebration must be used within CelebrationProvider');
  return ctx;
}
