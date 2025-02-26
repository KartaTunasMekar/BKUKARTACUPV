import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { doc, setDoc } from 'firebase/firestore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Password tidak cocok');
      return;
    }

    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save additional user data to 'bendahara' collection
      await setDoc(doc(db, 'bendahara', user.uid), {
        email: user.email,
        role: '', // Left empty for manual setting
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });

      toast.success('Pendaftaran berhasil');
      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email sudah terdaftar');
      } else {
        toast.error('Gagal mendaftar. Silakan coba lagi.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Daftar Akun Baru
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-soccer-green focus:border-soccer-green focus:z-10 sm:text-sm"
                placeholder="Alamat Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-soccer-green focus:border-soccer-green focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-soccer-green focus:border-soccer-green focus:z-10 sm:text-sm"
                placeholder="Konfirmasi Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-soccer-green hover:bg-soccer-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soccer-green"
            >
              Daftar
            </button>
          </div>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <Link
            to="/login"
            className="font-medium text-soccer-green hover:text-soccer-green-dark"
          >
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
