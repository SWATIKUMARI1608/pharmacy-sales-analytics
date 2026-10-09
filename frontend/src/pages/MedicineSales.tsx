import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import PageLayout from '../components/PageLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchMedicinesDetail, fetchTopMedicines } from '../api/sales';
import type { MedicineDetail, TopMedicine } from '../types';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4',
  '#84cc16', '#f97316', '#ec4899', '#6366f1', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#22d3ee'];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function monthToDate(month: string): string {
  const idx = MONTHS.indexOf(month) + 1;
  if (idx === 0) return '';
  return `2024-${String(idx).padStart(2, '0')}-01`;
}
function monthToEndDate(month: string): string {
  const idx = MONTHS.indexOf(month) + 1;
  if (idx === 0) return '';
  const lastDay = new Date(2024, idx, 0).getDate();
  return `2024-${String(idx).padStart(2, '0')}-${lastDay}`;
}

type SortKey = 'medicine_name' | 'category' | 'units_sold' | 'revenue' | 'margin_pct';
type SortDir = 'asc' | 'desc';

export default function MedicineSales() {
  const [medicines, setMedicines] = useState<MedicineDetail[]>([]);
  const [topMeds, setTopMeds] = useState<TopMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startMonth, setStartMonth] = useState('Jan');
  const [endMonth, setEndMonth] = useState('Dec');
  const [saleTypeFilter, setSaleTypeFilter] = useState<'All' | 'OTC' | 'Prescription'>('All');
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    setLoading(true);
    const start = monthToDate(startMonth);
    const end = monthToEndDate(endMonth);
    const params: Record<string, string> = {};
    if (start) params.start_date = start;
    if (end) params.end_date = end;
    if (saleTypeFilter !== 'All') params.sale_type = saleTypeFilter;

    Promise.all([
      fetchMedicinesDetail(params),
      fetchTopMedicines(15, start || undefined, end || undefined),
    ])
      .then(([m, t]) => { setMedicines(m); setTopMeds(t); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [startMonth, endMonth, saleTypeFilter]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  const sorted = [...medicines].sort((a, b) => {
    const va = a[sortKey] as number | string;
    const vb = b[sortKey] as number | string;
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const SortIndicator = ({ col }: { col: SortKey }) =>
    sortKey === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <PageLayout title="Medicine Sales">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Month</label>
          <select
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {MONTHS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">End Month</label>
          <select
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {MONTHS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          {(['All', 'OTC', 'Prescription'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSaleTypeFilter(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                saleTypeFilter === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner rows={6} />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Top 15 Medicines by Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topMeds} layout="vertical" margin={{ left: 140 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="medicine_name" tick={{ fontSize: 11 }} width={140} />
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {topMeds.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {(
                    [
                      ['medicine_name', 'Medicine'],
                      ['category', 'Category'],
                      ['units_sold', 'Units Sold'],
                      ['revenue', 'Revenue'],
                      ['margin_pct', 'Margin %'],
                    ] as [SortKey, string][]
                  ).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:text-gray-900 select-none"
                    >
                      {label}<SortIndicator col={key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.medicine_name}</td>
                    <td className="px-4 py-3 text-gray-600">{row.category}</td>
                    <td className="px-4 py-3 text-gray-700">{row.units_sold.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700">${row.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        row.margin_pct >= 40 ? 'bg-emerald-100 text-emerald-700'
                          : row.margin_pct >= 25 ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {row.margin_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
              {sorted.length} medicines
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
}
