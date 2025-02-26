export interface User {
  uid: string;
  email: string;
  displayName: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  userId: string;
}

export interface Bendahara {
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string;
}
