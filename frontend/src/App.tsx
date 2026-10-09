import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Overview from './pages/Overview';
import MedicineSales from './pages/MedicineSales';
import Categories from './pages/Categories';
import SeasonalTrends from './pages/SeasonalTrends';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: '📊' },
  { to: '/medicine-sales', label: 'Medicine Sales', icon: '💊' },
  { to: '/categories', label: 'Categories', icon: '📂' },
  { to: '/seasonal-trends', label: 'Seasonal Trends', icon: '📈' },
];

function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col min-h-screen shrink-0">
      <div className="px-5 py-6 border-b border-gray-700">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Pharmacy</p>
        <p className="text-base font-bold mt-0.5">Sales Analytics</p>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-gray-700 text-xs text-gray-500">
        Data: 2024 · SQLite
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 bg-gray-50 overflow-auto">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/medicine-sales" element={<MedicineSales />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/seasonal-trends" element={<SeasonalTrends />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
