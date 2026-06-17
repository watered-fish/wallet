export type TableName =
  | 'categories'
  | 'income'
  | 'expenses'
  | 'rent'
  | 'rent_payments';

export type OutboxKind = 'insert' | 'update' | 'delete';

export interface OutboxOp {
  opId: string;
  table: TableName;
  kind: OutboxKind;
  row: Record<string, unknown>; // insert/update: full row incl. id; delete: { id }
  ts: number;
}

const CACHE_PREFIX = 'wallet-cache:';
const OUTBOX_KEY = 'wallet-outbox';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readCache<T>(table: TableName): T[] {
  return safeParse<T[]>(localStorage.getItem(CACHE_PREFIX + table), []);
}

export function writeCache<T>(table: TableName, rows: T[]): void {
  localStorage.setItem(CACHE_PREFIX + table, JSON.stringify(rows));
}

export function getOutbox(): OutboxOp[] {
  return safeParse<OutboxOp[]>(localStorage.getItem(OUTBOX_KEY), []);
}

export function setOutbox(ops: OutboxOp[]): void {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(ops));
}

export function enqueue(op: Omit<OutboxOp, 'opId' | 'ts'>): void {
  const ops = getOutbox();
  ops.push({ ...op, opId: crypto.randomUUID(), ts: Date.now() });
  setOutbox(ops);
}

export function pendingCount(): number {
  return getOutbox().length;
}
