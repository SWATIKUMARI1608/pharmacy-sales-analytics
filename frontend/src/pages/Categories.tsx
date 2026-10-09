import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import PageLayout from '../components/PageLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchCategoryRevenueShare, fetchCategoryMonthly, fetchCategoryGrowth } from '../api/categories';
import type { CategoryRevenue, CategoryMonthly, CategoryGrowth } from '../types';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4',
  '#84cc16', '#f97316', '#ec4899', '#6366f1'];

const MONTHS_ORDER = ['2024-01','2024-02','2024-03','2024-04','2024-05','2024-06',
  '2024-07','2024-08','2024-09','2024-10','2024-11','2024-12'];
const MONTH_LABELS: Record<string, string> = {
  '2024-01':'Jan','2024-02':'Feb','2024-03':'Mar','2024-04':'Apr',
  '2024-05':'May','2024-06':'Jun','2024-07':'Jul','2024-08':'Aug',
  '2024-09':'Sep','2024-10':'Oct','2024-11':'Nov','2024-12':'Dec',
};

export default function Categories() {
  const [share, setShare] = useState<CategoryRevenue[]>([]);
  const [monthly, setMonthly] = useState<CategoryMonthly[]>([]);
  const [growth, setGrowth] = useState<CategoryGrowth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchCategoryRevenueShare(),
      fetchCategoryMonthly(),
      fetchCategoryGrowth(),
    ])
      .then(([s, m, g]) => { setShare(s); setMonthly(m); setGrowth(g); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLayout title="Category Breakdown"><LoadingSpinner rows={8} /></PageLayout>;
  if (error) return (
    <PageLayout title="Category Breakdown">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
    </PageLayout>
  );

  // Build stacked bar data
  const allCategories = Array.from(new Set(monthly.map((m) => m.category)));
  const stackedData = MONTHS_ORDER.map((mon) => {
    const row: Record<string, string | number> = { month: MONTH_LABELS[mon] ?? mon };
    allCategories.forEach((cat) => {
      const found = monthly.find((m) => m.month === mon && m.category === cat);
      row[cat] = found ? found.revenue : 0;
    });
    return row;
  });

  const filteredCategories = activeCategory ? [activeCategory] : allCategories;

  return (
    <PageLayout title="Category Breakdown">
      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeCategory === null ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {allCategories.map((cat, idx) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            style={activeCategory === cat ? { backgroundColor: COLORS[idx % COLORS.length] } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Donut Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Revenue Share by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={activeCategory ? share.filter((s) => s.category === activeCategory) : share}
                cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                dataKey="revenue"
                label={(props: PieLabelRenderProps) => {
                  const entry = props.payload as CategoryRevenue | undefined;
                  if (!entry) return '';
                  return `${entry.category}: ${entry.percentage}%`;
                }}
                labelLine={false}
              >
                {share.map((entry) => (
                  <Cell
                    key={entry.category}
                    fill={COLORS[allCategories.indexOf(entry.category) % COLORS.length]}
                    opacity={activeCategory && activeCategory !== entry.category ? 0.2 : 1}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Growth table */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm overflow-auto">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Month-over-Month Growth</h2>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="text-left px-2 py-2 text-xs text-gray-500 font-semibold uppercase">Category</th>
                <th className="text-right px-2 py-2 text-xs text-gray-500 font-semibold uppercase">This Month</th>
                <th className="text-right px-2 py-2 text-xs text-gray-500 font-semibold uppercase">Last Month</th>
                <th className="text-right px-2 py-2 text-xs text-gray-500 font-semibold uppercase">MoM %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {growth
                .filter((g) => !activeCategory || g.category === activeCategory)
                .map((g, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-2 py-2 font-medium text-gray-800">{g.category}</td>
                  <td className="px-2 py-2 text-right text-gray-700">${g.this_month_revenue.toLocaleString()}</td>
                  <td className="px-2 py-2 text-right text-gray-500">${g.last_month_revenue.toLocaleString()}</td>
                  <td className="px-2 py-2 text-right">
                    {g.mom_growth_pct !== null ? (
                      <span className={`font-semibold ${g.mom_growth_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {g.mom_growth_pct >= 0 ? '+' : ''}{g.mom_growth_pct}%
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Monthly Revenue by Category (Stacked)</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={stackedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
            <Legend />
            {filteredCategories.map((cat) => (
              <Bar
                key={cat}
                dataKey={cat}
                stackId="a"
                fill={COLORS[allCategories.indexOf(cat) % COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </PageLayout>
  );
}
