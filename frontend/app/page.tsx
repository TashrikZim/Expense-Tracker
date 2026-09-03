'use client';

import { useState, useEffect } from 'react';
import { login, register, getTransactions, createTransaction, Transaction } from './services/api';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [isRegisterView, setIsRegisterView] = useState(false);

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Dashboard data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // New Transaction state
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Expense');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [note, setNote] = useState('');

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserTransactions(savedToken);
    }
  }, []);

  const fetchUserTransactions = async (authToken: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await getTransactions(authToken);
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Session expired or fetch failed');
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthSuccess('');

    try {
      if (isRegisterView) {
        await register(email, password);
        setAuthSuccess('Registration successful! Please sign in.');
        setIsRegisterView(false);
      } else {
        const data = await login(email, password);
        localStorage.setItem('token', data.token);
        setToken(data.token);
        fetchUserTransactions(data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setTransactions([]);
    setEmail('');
    setPassword('');
    setError('');
    setAuthSuccess('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setError('');
      await createTransaction(token, {
        amount: parseFloat(amount),
        type,
        category,
        account,
        note,
      });
      setAmount('');
      setCategory('');
      setAccount('');
      setNote('');
      fetchUserTransactions(token);
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
    }
  };

  // --- VIEW 1: AUTHENTICATION SCREEN ---
  if (!token) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-center mb-2">Expense Tracker</h1>
          <p className="text-sm text-center text-gray-500 mb-6">
            {isRegisterView ? 'Create your user account' : 'Sign in to access your dashboard'}
          </p>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
          {authSuccess && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded">{authSuccess}</div>}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-2 border rounded text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2 border rounded text-sm outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded text-sm transition"
            >
              {isRegisterView ? 'Register Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {isRegisterView ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegisterView(false); setError(''); }}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegisterView(true); setError(''); }}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign Up
                </button>
              </span>
            )}
          </div>
        </div>
      </main>
    );
  }

  // --- VIEW 2: LOGGED-IN EXPENSE DASHBOARD ---
  return (
    <main className="max-w-4xl mx-auto p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Expense Tracker</h1>
        <button
          onClick={handleLogout}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium transition"
        >
          Sign Out
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      {/* Add Transaction Form */}
      <form onSubmit={handleCreate} className="mb-8 p-4 bg-white border rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <h2 className="text-xl font-semibold md:col-span-2">Add New Transaction</h2>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full p-2 border rounded text-sm"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full p-2 border rounded text-sm"
            placeholder="e.g. Food, Rent, Salary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Account</label>
          <input
            type="text"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            required
            className="w-full p-2 border rounded text-sm"
            placeholder="e.g. Bank, Cash"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Note (Optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            placeholder="Description..."
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-green-700 transition"
          >
            Add Transaction
          </button>
        </div>
      </form>

      {/* Transactions Table */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <h2 className="text-xl font-semibold p-4 bg-gray-50 border-b">Your Transactions</h2>
        {loading ? (
          <p className="p-4 text-gray-500 text-sm">Loading records...</p>
        ) : transactions.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">No records found. Create your first transaction above.</p>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3">Category</th>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Account</th>
                <th className="p-3">Note</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{tx.category}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        tx.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="p-3">${tx.amount.toFixed(2)}</td>
                  <td className="p-3">{tx.account}</td>
                  <td className="p-3 text-gray-500">{tx.note || '-'}</td>
                  <td className="p-3 text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}