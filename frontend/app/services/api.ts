const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5235/api';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  category: string;
  account: string;
  note?: string;
  date: string;
}

export type TransactionInput = {
  amount: number;
  type: string;
  category: string;
  account: string;
  note?: string;
  date?: string;
};

export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/Auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Registration failed');
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_URL}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Invalid credentials');
  }
  return res.json();
}

export async function getTransactions(token: string): Promise<Transaction[]> {
  const res = await fetch(`${API_URL}/Transactions`, {
    headers: { Authorization: `Bearer ${token.trim()}` },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function createTransaction(token: string, data: TransactionInput) {
  const res = await fetch(`${API_URL}/Transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.trim()}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to create transaction');
  return res.json();
}

export async function updateTransaction(token: string, id: string, data: TransactionInput) {
  const res = await fetch(`${API_URL}/Transactions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.trim()}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to update transaction');
  return res.json();
}

export async function deleteTransaction(token: string, id: string) {
  const res = await fetch(`${API_URL}/Transactions/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token.trim()}` },
  });

  if (!res.ok) throw new Error('Failed to delete transaction');
  return true;

  export async function fetchMonthlySummary(year: number) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Transactions/summary/monthly?year=${year}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch monthly summary");
  return res.json();
}
}