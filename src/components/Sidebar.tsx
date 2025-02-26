import { NavLink } from 'react-router-dom';
import { Home, Receipt, FileText } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-lg hidden md:block">
      <div className="h-full px-3 py-4">
        <nav className="space-y-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-soccer-green text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Home className="mr-3 h-5 w-5" />
            Dashboard
          </NavLink>

          <NavLink
            to="/transaksi"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-soccer-green text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Receipt className="mr-3 h-5 w-5" />
            Transaksi
          </NavLink>

          <NavLink
            to="/laporan"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-soccer-green text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <FileText className="mr-3 h-5 w-5" />
            Laporan
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}
