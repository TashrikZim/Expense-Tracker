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

export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/Auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Registration failed');
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
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Invalid credentials');
  }
  return res.json();
}

export async function getTransactions(token: string): Promise<Transaction[]> {
  const cleanToken = token.trim();
  const res = await fetch(`${API_URL}/Transactions`, {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return res.json();
}

export async function createTransaction(
  token: string,
  data: Omit<Transaction, 'id' | 'userId' | 'date' | 'createdAt'>
) {
  const cleanToken = token.trim();
  const res = await fetch(`${API_URL}/Transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cleanToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to create transaction');
  }
  return res.json();
}