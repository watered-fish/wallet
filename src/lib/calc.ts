import { ROOMMATES } from './types';
import type { Expense, Income, Rent, RentPayment, RoommateName } from './types';

export function sumIncome(income: Income[]): number {
  return income.reduce((acc, i) => acc + i.amount, 0);
}

export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((acc, e) => acc + e.amount, 0);
}

export function rentShare(rent: Rent | null): number {
  if (!rent) return 0;
  return rent.total_amount / ROOMMATES.length;
}

/**
 * Caleb's rent share is deducted from his budget; the other two shares are not.
 * So the month's effective spend is logged expenses + Caleb's share only.
 */
export function effectiveExpenses(expenses: Expense[], rent: Rent | null): number {
  return sumExpenses(expenses) + rentShare(rent);
}

export function netSavings(income: Income[], expenses: Expense[], rent: Rent | null): number {
  return sumIncome(income) - effectiveExpenses(expenses, rent);
}

/** Savings as a percentage of the month's total income. */
export function savingsRate(income: Income[], expenses: Expense[], rent: Rent | null): number {
  const total = sumIncome(income);
  if (total <= 0) return 0;
  return (netSavings(income, expenses, rent) / total) * 100;
}

export function categorySpent(expenses: Expense[], categoryId: string): number {
  return expenses
    .filter((e) => e.category_id === categoryId)
    .reduce((acc, e) => acc + e.amount, 0);
}

export function paidByPerson(payments: RentPayment[], person: RoommateName): number {
  return payments
    .filter((p) => p.person === person)
    .reduce((acc, p) => acc + p.amount, 0);
}

export function isPersonPaid(
  payments: RentPayment[],
  person: RoommateName,
  share: number,
): boolean {
  if (share <= 0) return false;
  return paidByPerson(payments, person) + 1e-6 >= share;
}

export function allRoommatesPaid(payments: RentPayment[], share: number): boolean {
  if (share <= 0) return false;
  return ROOMMATES.every((p) => isPersonPaid(payments, p, share));
}
