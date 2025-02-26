import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Activity, CircleArrowDown, CircleArrowUp, Calendar, TrendingUp, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Transaction } from '../types';

const COLORS = ['#2E7D32', '#D32F2F', '#1976D2', '#FFC107', '#9C27B0', '#FF5722'];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [currentUser, timeframe]);

  const fetchTransactions = async () => {
    if (!currentUser) return;

    try {
      const timeframeDate = new Date();
      if (timeframe === 'daily') timeframeDate.setDate(timeframeDate.getDate() - 7);
      if (timeframe === 'weekly') timeframeDate.setDate(timeframeDate.getDate() - 30);
      if (timeframe === 'monthly') timeframeDate.setDate(timeframeDate.getDate() - 90);

      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const transactionsData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];

      const filteredTransactions = transactionsData
        .filter(t => new Date(t.date) >= timeframeDate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(filteredTransactions);
      
      const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setTotalIncome(income);
      setTotalExpense(expense);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  const getChartData = () => {
    const groupedData = transactions.reduce((acc: any, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString('id-ID', { 
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }
      if (transaction.type === 'income') {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }
      return acc;
    }, {});

    return Object.values(groupedData).slice(-7); // Last 7 days
  };

  const getCategoryData = () => {
    const categoryData = transactions.reduce((acc: any, transaction) => {
      const { category, amount, type } = transaction;
      if (!acc[category]) {
        acc[category] = { name: category, value: 0 };
      }
      acc[category].value += amount;
      acc[category].type = type;
      return acc;
    }, {});

    return Object.values(categoryData)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 6); // Top 6 categories
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soccer-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Time Frame Selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period as any)}
              className={`px-4 py-2 rounded-lg transition-all ${
                timeframe === period 
                  ? 'bg-soccer-green text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-soccer-green to-green-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total Pemasukan</p>
              <p className="text-2xl font-bold mt-2">
                Rp {totalIncome.toLocaleString()}
              </p>
            </div>
            <CircleArrowUp className="h-10 w-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-accent-red to-red-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Total Pengeluaran</p>
              <p className="text-2xl font-bold mt-2">
                Rp {totalExpense.toLocaleString()}
              </p>
            </div>
            <CircleArrowDown className="h-10 w-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-dynamic-blue to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Saldo</p>
              <p className="text-2xl font-bold mt-2">
                Rp {(totalIncome - totalExpense).toLocaleString()}
              </p>
            </div>
            <Wallet className="h-10 w-10 opacity-80" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Tren Transaksi</h3>
            <Activity className="text-gray-400" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any) => [`Rp ${value.toLocaleString()}`, '']}
                />
                <Bar dataKey="income" fill="#2E7D32" name="Pemasukan" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#D32F2F" name="Pengeluaran" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Distribusi Kategori</h3>
            <TrendingUp className="text-gray-400" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getCategoryData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getCategoryData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`Rp ${value.toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Transaksi Terakhir</h3>
            <Calendar className="text-gray-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.slice(0, 5).map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(transaction.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.description}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} Rp {transaction.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <Link
            to="/transaksi"
            className="text-soccer-green hover:text-green-700 text-sm font-medium"
          >
            Lihat Semua Transaksi →
          </Link>
        </div>
      </div>
    </div>
  );
}
