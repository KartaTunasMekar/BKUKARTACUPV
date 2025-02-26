import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowUp10, Calendar, CircleArrowDown, Download, FileSpreadsheet, Filter, Wallet } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const COLORS = ['#2E7D32', '#D32F2F', '#1976D2', '#FFC107', '#9C27B0', '#FF5722'];

export default function Reports() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const reportRef = useRef(null);

  useEffect(() => {
    fetchTransactions();
  }, [currentUser, startDate, endDate, filterType]);

  const fetchTransactions = async () => {
    if (!currentUser || !startDate || !endDate) return;

    try {
      setLoading(true);
      const baseQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', currentUser.uid),
        where('date', '>=', startDate.toISOString()),
        where('date', '<=', endDate.toISOString()),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(baseQuery);
      let transactionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

      // Filter by type if not 'all'
      if (filterType !== 'all') {
        transactionsData = transactionsData.filter(t => t.type === filterType);
      }

      setTransactions(transactionsData);

      const income = transactionsData
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = transactionsData
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setTotalIncome(income);
      setTotalExpense(expense);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    try {
      const worksheetData = transactions.map(t => ({
        Tanggal: new Date(t.date).toLocaleDateString('id-ID'),
        Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        Kategori: t.category,
        Keterangan: t.description,
        Jumlah: t.amount
      }));

      const ws = XLSX.utils.json_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Keuangan');

      // Add summary sheet
      const summaryData = [
        ['Ringkasan Laporan'],
        ['Periode', `${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`],
        ['Total Pemasukan', totalIncome],
        ['Total Pengeluaran', totalExpense],
        ['Saldo', totalIncome - totalExpense]
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

      // Generate filename with date range
      const filename = `Laporan_Keuangan_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('Berhasil mengunduh laporan Excel');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Gagal mengunduh laporan Excel');
    }
  };

  interface PDFDocumentProps {
    data: Transaction[];
    period: string;
    summary: {
      income: number;
      expense: number;
    };
  };

  // Define PDF styles
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: 30,
    },
    section: {
      margin: 10,
      padding: 10,
    },
    title: {
      fontSize: 24,
      marginBottom: 20,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 18,
      marginBottom: 10,
    },
    table: {
      display: 'flex',
      width: 'auto',
      marginVertical: 10,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#000',
      borderBottomStyle: 'solid',
      alignItems: 'center',
      minHeight: 25,
    },
    tableHeader: {
      backgroundColor: '#f0f0f0',
    },
    tableCol: {
      width: '25%',
    },
    tableCell: {
      fontSize: 10,
      padding: 5,
    },
    summary: {
      marginTop: 20,
      padding: 10,
      backgroundColor: '#f0f0f0',
    },
  });

  // PDF Document Component
  const PDFDocument: React.FC<PDFDocumentProps> = ({ data, period, summary }) => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Laporan Keuangan</Text>
          <Text style={styles.subtitle}>Periode: {period}</Text>
          
          {/* Summary Section */}
          <View style={styles.summary}>
            <Text>Total Pemasukan: Rp {summary.income.toLocaleString()}</Text>
            <Text>Total Pengeluaran: Rp {summary.expense.toLocaleString()}</Text>
            <Text>Saldo: Rp {(summary.income - summary.expense).toLocaleString()}</Text>
          </View>

          {/* Transactions Table */}
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Tanggal</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Kategori</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Keterangan</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Jumlah</Text></View>
            </View>
            
            {data.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {new Date(item.date).toLocaleDateString('id-ID')}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.category}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.description}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {item.type === 'income' ? '+' : '-'} Rp {item.amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );

  const downloadPDF = () => {
    const period = `${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`;
    const summary = {
      income: totalIncome,
      expense: totalExpense
    };

    return (
      <PDFDownloadLink
        document={<PDFDocument data={transactions} period={period} summary={summary} />}
        fileName={`Laporan_Keuangan_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`}
      >
        {({ loading }) => 
          loading ? 'Generating PDF...' : 'Download PDF'
        }
      </PDFDownloadLink>
    );
  };

  const getCategoryData = () => {
    const categoryData = transactions.reduce((acc: any, transaction) => {
      const { category, amount, type } = transaction;
      if (!acc[category]) {
        acc[category] = { name: category, value: 0, type };
      }
      acc[category].value += amount;
      return acc;
    }, {});

    return Object.values(categoryData)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 6);
  };

  const getDailyData = () => {
    const dailyData = transactions.reduce((acc: any, transaction) => {
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

    return Object.values(dailyData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soccer-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={downloadExcel}
            className="flex items-center px-4 py-2 bg-dynamic-blue text-white rounded-lg hover:bg-opacity-90 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </button>
          <button
            className="flex items-center px-4 py-2 bg-soccer-green text-white rounded-lg hover:bg-opacity-90 transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloadPDF()}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <Filter className="w-5 h-5" />
          <span className="font-medium">Filter</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => date && setStartDate(date)}
              dateFormat="EEEE, dd MMMM yyyy"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soccer-green focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => date && setEndDate(date)}
              dateFormat="EEEE, dd MMMM yyyy"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soccer-green focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Transaksi</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soccer-green focus:border-transparent"
            >
              <option value="all">Semua</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
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
            <ArrowUp10 className="h-10 w-10 opacity-80" />
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Tren Transaksi</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getDailyData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Distribusi Kategori</h3>
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

      {/* Detailed Transactions Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Detail Transaksi</h3>
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
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(transaction.date).toLocaleDateString('id-ID')}
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
      </div>
    </div>
  );
}
