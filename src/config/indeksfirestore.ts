/**
 * Indeks Firestore yang Diperlukan
 * 
 * Dokumen ini menjelaskan indeks komposit yang dibutuhkan untuk query Firestore.
 * Harap buat indeks-indeks ini di Firebase Console untuk memastikan aplikasi berfungsi dengan baik.
 */

export const requiredIndexes = [
  {
    collectionGroup: 'pemasukan',
    queryScope: 'COLLECTION',
    fields: [
      {
        fieldPath: 'userId',
        order: 'ASCENDING'
      },
      {
        fieldPath: 'date',
        order: 'DESCENDING'
      }
    ]
  },
  {
    collectionGroup: 'pengeluaran',
    queryScope: 'COLLECTION',
    fields: [
      {
        fieldPath: 'userId',
        order: 'ASCENDING'
      },
      {
        fieldPath: 'date',
        order: 'DESCENDING'
      }
    ]
  }
];

/**
 * Link untuk membuat indeks:
 * https://console.firebase.google.com/project/bku-5a8af/firestore/indexes
 * 
 * Indeks-indeks ini diperlukan untuk:
 * 1. Mengurutkan transaksi berdasarkan tanggal (terbaru ke terlama)
 * 2. Memfilter transaksi berdasarkan userId
 * 3. Mendukung pagination dengan limit dan startAfter
 * 
 * Contoh query yang membutuhkan indeks:
 * ```typescript
 * const q = query(
 *   collection(db, 'pemasukan'),
 *   where('userId', '==', currentUser.uid),
 *   orderBy('date', 'desc'),
 *   limit(20)
 * );
 * ```
 */

export const indexCreationSteps = [
  "1. Buka Firebase Console",
  "2. Pilih project 'bku-5a8af'",
  "3. Buka menu 'Firestore Database'",
  "4. Pilih tab 'Indexes'",
  "5. Klik tombol 'Create Index'",
  "6. Pilih collection ('pemasukan' atau 'pengeluaran')",
  "7. Tambahkan field 'userId' (Ascending) dan 'date' (Descending)",
  "8. Klik 'Create Index'",
  "9. Tunggu hingga indeks selesai dibuat (status menjadi 'Enabled')"
];

import { where, orderBy, limit, startAfter, QueryConstraint } from 'firebase/firestore';

/**
 * Query Helper
 * Fungsi untuk membantu membuat query dengan indeks yang benar
 */
export const createIndexedQuery = (
  collectionName: 'pemasukan' | 'pengeluaran',
  userId: string,
  pageSize: number = 20,
  lastDoc?: any
): QueryConstraint[] => {
  // Using collectionName to demonstrate it's being used, though not directly needed for query constraints
  console.log(`Creating query for collection: ${collectionName}`);
  
  const baseQuery: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(pageSize)
  ];

  if (lastDoc) {
    baseQuery.push(startAfter(lastDoc));
  }

  return baseQuery;
};
