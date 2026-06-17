import { supabase } from './supabase';
import {
  type OutboxOp,
  type TableName,
  enqueue,
  getOutbox,
  readCache,
  setOutbox,
  writeCache,
} from './offline';
import type { Category, Expense, Income, Rent, RentPayment } from './types';

export interface TableMap {
  categories: Category;
  income: Income;
  expenses: Expense;
  rent: Rent;
  rent_payments: RentPayment;
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

/**
 * Fetch the full table for the current user. On network failure, fall back to
 * the local cache so the app keeps working offline.
 */
export async function pull<K extends TableName>(table: K): Promise<TableMap[K][]> {
  if (!isOnline()) return readCache<TableMap[K]>(table);
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: true });
  if (error || !data) return readCache<TableMap[K]>(table);
  writeCache<TableMap[K]>(table, data as TableMap[K][]);
  return data as TableMap[K][];
}

export async function insertRow<K extends TableName>(
  table: K,
  row: TableMap[K],
): Promise<void> {
  if (!isOnline()) {
    enqueue({ table, kind: 'insert', row: row as unknown as Record<string, unknown> });
    return;
  }
  const { error } = await supabase.from(table).insert(row);
  if (error) enqueue({ table, kind: 'insert', row: row as unknown as Record<string, unknown> });
}

export async function updateRow<K extends TableName>(
  table: K,
  id: string,
  patch: Partial<TableMap[K]>,
): Promise<void> {
  const row = { id, ...patch } as Record<string, unknown>;
  if (!isOnline()) {
    enqueue({ table, kind: 'update', row });
    return;
  }
  const { error } = await supabase.from(table).update(patch as TableMap[K]).eq('id', id);
  if (error) enqueue({ table, kind: 'update', row });
}

export async function deleteRow<K extends TableName>(table: K, id: string): Promise<void> {
  if (!isOnline()) {
    enqueue({ table, kind: 'delete', row: { id } });
    return;
  }
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) enqueue({ table, kind: 'delete', row: { id } });
}

/**
 * Replay queued writes in order. Stops and re-saves remaining ops on the first
 * failure so nothing is dropped.
 */
export async function flushOutbox(): Promise<number> {
  if (!isOnline()) return 0;
  const ops = getOutbox();
  if (ops.length === 0) return 0;

  const remaining: OutboxOp[] = [];
  let flushed = 0;
  let failed = false;

  for (const op of ops) {
    if (failed) {
      remaining.push(op);
      continue;
    }
    const ok = await applyOp(op);
    if (ok) flushed += 1;
    else {
      failed = true;
      remaining.push(op);
    }
  }

  setOutbox(remaining);
  return flushed;
}

async function applyOp(op: OutboxOp): Promise<boolean> {
  const { table, kind, row } = op;
  if (kind === 'insert') {
    const { error } = await supabase.from(table).insert(row);
    return !error;
  }
  if (kind === 'update') {
    const { id, ...patch } = row as { id: string } & Record<string, unknown>;
    const { error } = await supabase.from(table).update(patch).eq('id', id);
    return !error;
  }
  const { error } = await supabase.from(table).delete().eq('id', (row as { id: string }).id);
  return !error;
}
