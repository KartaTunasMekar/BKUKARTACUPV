import { Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useState } from 'react';

export default function Navbar() {
  const { currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Gagal logout:', error);
    }
  };

  return (
    <nav className="bg-soccer-green text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">BKU KARTA CUP V</h1>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <span>{currentUser?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-accent-red hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Keluar
              </button>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md hover:bg-soccer-green-dark"
            >
              <Menu />
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <div className="flex flex-col items-center space-y-2">
              <span>{currentUser?.email}</span>
              <button
                onClick={handleLogout}
                className="w-full bg-accent-red hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
