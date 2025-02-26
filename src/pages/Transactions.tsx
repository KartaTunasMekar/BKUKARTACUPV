import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, CircleArrowDown, CircleArrowUp, CirclePlus, Search, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Transaction } from '../types';
import toast from 'react-hot-toast';
import { validateAmount, validateDescription } from '../utils/validation';

export default function Transactions() {
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterDate, setFilterDate] = useState<Date | null>(null);

  // Form states
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');

  const categories = {
    income: [
      'Pendaftaran',
      'Sponsor',
      'Donasi',
      'Kopi Kopji',
      'Tiket dan Parkir',
      'Iuran Warung',
      'Kartu Merah Dan Kuning',
      'Lainnya'
    ],
    expense: [
      'Beli Kopi',
      'Operasional',
      'Perlengkapan',
      'Konsumsi',
      'Transportasi',
      'Izin Keramaian',
      'Keamanan Harian',
      'Bayar Wasit',
      'Bayar Warung',
      'Bayar Anak Gawang',
      'Lainnya'
    ]
  };

  const resetForm = () => {
    setType('income');
    setCategory('');
    setAmount('');
    setDate(new Date());
    setDescription('');
    setShowForm(false);
  };

  const formatAmount = (value: string) => {
    return value.replace(/[^0-9]/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    if (!category) {
      toast.error('Silakan pilih kategori');
      return;
    }

    if (!validateAmount(amount)) {
      toast.error('Jumlah harus lebih dari 0 dan kurang dari 1 milyar');
      return;
    }

    if (!validateDescription(description)) {
      toast.error('Keterangan harus diisi (3-100 karakter)');
      return;
    }

    try {
      setSubmitting(true);
      const numericAmount = parseInt(amount.replace(/[^0-9]/g, ''));
      
      const newTransaction = {
        type,
        category,
        amount: numericAmount,
        date: date.toISOString(),
        description: description.trim(),
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'transactions'), newTransaction);
      
      toast.success('Transaksi berhasil ditambahkan');
      resetForm();
      fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Gagal menambahkan transaksi. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchTransactions = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const baseQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(baseQuery);
      let transactionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

      if (searchTerm) {
        transactionsData = transactionsData.filter(t => 
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (filterType !== 'all') {
        transactionsData = transactionsData.filter(t => t.type === filterType);
      }

      if (filterDate) {
        transactionsData = transactionsData.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.toDateString() === filterDate.toDateString();
        });
      }

      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentUser, searchTerm, filterType, filterDate]);

  const groupTransactionsByDate = () => {
    const groups = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      if (!acc[date]) {
        acc[date] = {
          transactions: [],
          totalIncome: 0,
          totalExpense: 0
        };
      }
      
      acc[date].transactions.push(transaction);
      if (transaction.type === 'income') {
        acc[date].totalIncome += transaction.amount;
      } else {
        acc[date].totalExpense += transaction.amount;
      }
      
      return acc;
    }, {} as Record<string, { transactions: Transaction[], totalIncome: number, totalExpense: number }>);

    return Object.entries(groups);
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaksi</h1>
            <p className="text-gray-600">Kelola transaksi pemasukan dan pengeluaran</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-soccer-green text-white rounded-lg hover:bg-opacity-90 transition-all shadow-sm"
          >
            <CirclePlus className="w-5 h-5 mr-2" />
            Tambah Transaksi
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soccer-green focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soccer-green focus:border-transparent bg-white"
            >
              <option value="all">Semua</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
            <div className="w-40">
              <DatePicker
                selected={filterDate}
                onChange={(date: Date | null) => setFilterDate(date)}
                placeholderText="Filter tanggal"
                isClearable
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soccer-green focus:border-transparent"
                dateFormat="EEEE, dd MMMM yyyy"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soccer-green"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada transaksi</h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== 'all' || filterDate
                ? 'Tidak ada transaksi yang sesuai dengan filter'
                : 'Mulai tambahkan transaksi baru'}
            </p>
          </div>
        ) : (
          groupTransactionsByDate().map(([date, group]) => (
            <div key={date} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                  <h3 className="font-medium text-gray-900">{date}</h3>
                </div>
                <div className="text-sm">
                  <span className="text-green-600 mr-4">
                    +Rp {group.totalIncome.toLocaleString()}
                  </span>
                  <span className="text-red-600">
                    -Rp {group.totalExpense.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {group.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'income'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'income' ? (
                          <CircleArrowUp className="w-5 h-5" />
                        ) : (
                          <CircleArrowDown className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{transaction.category}</h4>
                        <p className="text-sm text-gray-600">{transaction.description}</p>
                      </div>
                    </div>
                    <div className={`font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      Rp {transaction.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Transaction Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Tambah Transaksi Baru</h2>
                <button 
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Transaksi
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setType('income');
                          setCategory('');
                        }}
                        className={`flex-1 py-3 px-4 rounded-lg border ${
                          type === 'income'
                            ? 'bg-green-50 border-green-500 text-green-700'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        } transition-all`}
                      >
                        <CircleArrowUp className={`w-5 h-5 mx-auto mb-2 ${
                          type === 'income' ? 'text-green-500' : 'text-gray-400'
                        }`} />
                        Pemasukan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setType('expense');
                          setCategory('');
                        }}
                        className={`flex-1 py-3 px-4 rounded-lg border ${
                          type === 'expense'
                            ? 'bg-red-50 border-red-500 text-red-700'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        } transition-all`}
                      >
                        <CircleArrowDown className={`w-5 h-5 mx-auto mb-2 ${
                          type === 'expense' ? 'text-red-500' : 'text-gray-400'
                        }`} />
                        Pengeluaran
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soccer-green focus:border-transparent bg-white shadow-sm"
                    >
                      <option value="">Pilih Kategori</option>
                      {categories[type].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(formatAmount(e.target.value))}
                        placeholder="0"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soccer-green focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal
                    </label>
                    <DatePicker
                      selected={date}
                      onChange={(date: Date | null) => date && setDate(date)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soccer-green focus:border-transparent"
                      dateFormat="EEEE, dd MMMM yyyy"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Masukkan keterangan transaksi"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soccer-green focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-soccer-green text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
