export type MonthKey = string; // 'yyyy-MM'

export type RoommateName = 'Caleb' | 'Rich' | 'Bella';
export const ROOMMATES: RoommateName[] = ['Caleb', 'Rich', 'Bella'];

export interface Category {
  id: string;
  name: string;
  color: string;
  budget_cap: number; // global, persists across months
  is_default: boolean;
  created_at: string;
}

export type IncomeType = 'paycheck' | 'other';

export interface Income {
  id: string;
  month: MonthKey;
  type: IncomeType;
  label: string;
  amount: number;
  created_at: string;
}

export interface Expense {
  id: string;
  month: MonthKey;
  amount: number;
  category_id: string | null; // null when its category was deleted
  date: string; // 'yyyy-MM-dd'
  note: string | null;
  created_at: string;
}

export interface Rent {
  id: string;
  month: MonthKey;
  total_amount: number;
  created_at: string;
}

export interface RentPayment {
  id: string;
  month: MonthKey;
  person: RoommateName;
  amount: number;
  date: string; // 'yyyy-MM-dd'
  created_at: string;
}

export interface MonthData {
  income: Income[];
  expenses: Expense[];
  rent: Rent | null;
  rentPayments: RentPayment[];
}
