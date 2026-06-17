import { useEffect, useMemo, useState } from 'react';

const EMOJIS = ['💵', '💸', '🪙', '💰'];

interface Bill {
  id: number;
  left: number;
  delay: number;
  duration: number;
  emoji: string;
  size: number;
}

/** Brief (~2.6s) falling-money overlay. Renders nothing when inactive. */
export function MoneyRain({ active, onDone }: { active: boolean; onDone: () => void }) {
  const [show, setShow] = useState(false);

  const bills = useMemo<Bill[]>(() => {
    return Array.from({ length: 36 }, (_, id) => ({
      id,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.8 + Math.random() * 1.0,
      emoji: EMOJIS[id % EMOJIS.length] ?? '💵',
      size: 20 + Math.random() * 22,
    }));
  }, [active]);

  useEffect(() => {
    if (!active) return;
    setShow(true);
    const t = window.setTimeout(() => {
      setShow(false);
      onDone();
    }, 2600);
    return () => window.clearTimeout(t);
  }, [active, onDone]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {bills.map((b) => (
        <span
          key={b.id}
          style={{
            position: 'absolute',
            top: '-10vh',
            left: `${b.left}%`,
            fontSize: `${b.size}px`,
            animation: `fall ${b.duration}s ${b.delay}s ease-in forwards`,
          }}
        >
          {b.emoji}
        </span>
      ))}
    </div>
  );
}
