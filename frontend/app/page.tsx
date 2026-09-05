'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  login,
  register,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  Transaction,
} from './services/api';

type TimeFilter = 'week' | 'month' | 'year' | 'all';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [isRegisterView, setIsRegisterView] = useState(false);

  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Transactions & UI State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Form Inputs (Add & Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Expense');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Calendar Navigation
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      loadTransactions(savedToken);
    }
  }, []);

  const loadTransactions = async (authToken: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await getTransactions(authToken);
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Session expired. Please log in again.');
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
        loadTransactions(data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setTransactions([]);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setError('');
      const payload = {
        amount: parseFloat(amount),
        type,
        category,
        account,
        note,
        date: new Date(date).toISOString(),
      };

      if (editingId) {
        await updateTransaction(token, editingId, payload);
        setEditingId(null);
      } else {
        await createTransaction(token, payload);
      }

      // Reset form
      setAmount('');
      setCategory('');
      setAccount('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      loadTransactions(token);
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    }
  };

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setAmount(tx.amount.toString());
    setType(tx.type);
    setCategory(tx.category);
    setAccount(tx.account);
    setNote(tx.note || '');
    setDate(new Date(tx.date).toISOString().split('T')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setCategory('');
    setAccount('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await deleteTransaction(token, id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete transaction');
    }
  };

  // --- Filtering & Metrics Calculation ---
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      if (timeFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return txDate >= weekAgo && txDate <= now;
      }
      if (timeFilter === 'month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'year') {
        return txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, timeFilter]);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'Income') income += tx.amount;
      else expense += tx.amount;
    });
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  // Calendar Day Totals calculation
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Map day numbers to expense totals
    const dayTotals: { [key: number]: number } = {};
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d.getFullYear() === year && d.getMonth() === month && tx.type === 'Expense') {
        const day = d.getDate();
        dayTotals[day] = (dayTotals[day] || 0) + tx.amount;
      }
    });

    return { firstDayIndex, totalDays, dayTotals, month, year };
  }, [calendarDate, transactions]);

  // --- VIEW: AUTHENTICATION ---
  if (!token) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-center mb-2">Expense Tracker</h1>
          <p className="text-sm text-center text-gray-500 mb-6">
            {isRegisterView ? 'Register your account' : 'Sign in to your account'}
          </p>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
          {authSuccess && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded">{authSuccess}</div>}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded text-sm outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded text-sm transition"
            >
              {isRegisterView ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <button
              onClick={() => { setIsRegisterView(!isRegisterView); setError(''); }}
              className="text-blue-600 hover:underline font-medium"
            >
              {isRegisterView ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // --- VIEW: MAIN APPLICATION ---
  return (
    <main className="max-w-5xl mx-auto p-6 font-sans space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Expense Tracker</h1>
        <button
          onClick={handleLogout}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium transition"
        >
          Sign Out
        </button>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700 font-semibold uppercase">Total Income</p>
          <p className="text-2xl font-bold text-green-800">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700 font-semibold uppercase">Total Expense</p>
          <p className="text-2xl font-bold text-red-800">${totalExpense.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 font-semibold uppercase">Net Balance</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-800' : 'text-red-600'}`}>
            ${balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Time Filtering Controls */}
      <div className="flex justify-between items-center bg-white p-3 border rounded-lg shadow-sm">
        <div className="flex space-x-2">
          {(['week', 'month', 'year', 'all'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1.5 rounded text-xs font-semibold capitalize transition ${
                timeFilter === filter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter === 'all' ? 'All Time' : `This ${filter}`}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              viewMode === 'list' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              viewMode === 'calendar' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {/* Add / Edit Transaction Form */}
      <form onSubmit={handleFormSubmit} className="p-4 bg-white border rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <h2 className="text-lg font-semibold md:col-span-3">
          {editingId ? 'Edit Transaction' : 'Add New Transaction'}
        </h2>
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
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full p-2 border rounded text-sm"
          />
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
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Note (Optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            placeholder="Description..."
          />
        </div>
        <div className="md:col-span-3 flex space-x-2">
          <button
            type="submit"
            className="bg-green-600 text-white px-5 py-2 rounded text-sm font-semibold hover:bg-green-700 transition"
          >
            {editingId ? 'Update Transaction' : 'Add Transaction'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-gray-200 text-gray-700 px-5 py-2 rounded text-sm font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Main Content Area: Calendar or Table */}
      {viewMode === 'calendar' ? (
        <div className="bg-white border rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">
              {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="space-x-2">
              <button
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
              >
                &larr; Prev
              </button>
              <button
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
              >
                Next &rarr;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-gray-500 mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: calendarDays.firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 bg-gray-50 border border-gray-100 rounded p-1"></div>
            ))}
            {Array.from({ length: calendarDays.totalDays }).map((_, i) => {
              const day = i + 1;
              const spend = calendarDays.dayTotals[day];
              return (
                <div key={day} className="h-20 border rounded p-1.5 flex flex-col justify-between hover:bg-gray-50 transition">
                  <span className="text-xs font-medium text-gray-700">{day}</span>
                  {spend ? (
                    <span className="text-xs font-bold text-red-600 bg-red-50 p-0.5 rounded text-center">
                      -${spend.toFixed(0)}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-bold text-gray-700">Transactions List</h3>
          </div>
          {loading ? (
            <p className="p-4 text-gray-500 text-sm">Loading records...</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="p-4 text-gray-500 text-sm">No transactions match the selected filter.</p>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b text-xs text-gray-600 uppercase">
                  <th className="p-3">Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Account</th>
                  <th className="p-3">Note</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="p-3 font-medium">{tx.category}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          tx.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">${tx.amount.toFixed(2)}</td>
                    <td className="p-3 text-gray-600">{tx.account}</td>
                    <td className="p-3 text-gray-500">{tx.note || '-'}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => startEdit(tx)}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="text-xs text-red-600 hover:underline font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </main>
  );
}