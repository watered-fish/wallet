import { format, addMonths, parse, startOfMonth, isSameMonth } from 'date-fns';
import type { MonthKey } from './types';

export function monthKeyOf(date: Date): MonthKey {
  return format(date, 'yyyy-MM');
}

export function currentMonthKey(): MonthKey {
  return monthKeyOf(new Date());
}

export function dayKeyOf(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function today(): string {
  return dayKeyOf(new Date());
}

export function monthDate(key: MonthKey): Date {
  return parse(key, 'yyyy-MM', new Date());
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  return monthKeyOf(addMonths(monthDate(key), delta));
}

export function monthLabel(key: MonthKey): string {
  return format(monthDate(key), 'MMMM yyyy');
}

export function isCurrentMonth(key: MonthKey): boolean {
  return isSameMonth(monthDate(key), new Date());
}

export function startOfMonthDate(key: MonthKey): Date {
  return startOfMonth(monthDate(key));
}

/** Days remaining in the current calendar month, counting today. */
export function daysLeftInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate() + 1;
}

/**
 * Milliseconds until the next calendar month begins (midnight on the 1st).
 * Used to auto-advance the active month without a manual button.
 */
export function msUntilNextMonth(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return next.getTime() - now.getTime();
}
