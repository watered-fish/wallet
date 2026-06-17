export interface DefaultCategory {
  name: string;
  color: string;
  budget_cap: number;
}

// Distinct hues so calendar dots read clearly against the dark theme.
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Food', color: '#ff8c42', budget_cap: 500 },
  { name: 'Gas', color: '#4dd0e1', budget_cap: 200 },
  { name: 'Rent', color: '#7c5cff', budget_cap: 1200 },
  { name: 'Utilities', color: '#ffd166', budget_cap: 250 },
  { name: 'Subscriptions', color: '#ef5da8', budget_cap: 100 },
  { name: 'Entertainment', color: '#3ddc97', budget_cap: 200 },
  { name: 'Misc', color: '#9aa0aa', budget_cap: 150 },
];

// Palette offered when creating a custom category.
export const CATEGORY_PALETTE: string[] = [
  '#ff8c42', '#4dd0e1', '#7c5cff', '#ffd166', '#ef5da8',
  '#3ddc97', '#9aa0aa', '#ff6b6b', '#5c9dff', '#b388ff',
  '#26c6da', '#c0ca33',
];
