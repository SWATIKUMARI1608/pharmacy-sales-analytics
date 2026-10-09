import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import PageLayout from '../components/PageLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchMonthlyTrend, fetchPeakMonths, fetchYoYComparison, fetchHeatmap } from '../api/seasonal';
import type { SeasonalMonthlyTrend, PeakMonth, YoYComparison, HeatmapCell } from '../types';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4',
  '#84cc16', '#f97316', '#ec4899', '#6366f1'];

const MONTH_ORDER = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SeasonalTrends() {
  const [trend, setTrend] = useState<SeasonalMonthlyTrend[]>([]);
  const [peaks, setPeaks] = useState<PeakMonth[]>([]);
  const [yoy, setYoy] = useState<YoYComparison[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetchMonthlyTrend(),
      fetchPeakMonths(),
      fetchYoYComparison(),
      fetchHeatmap(),
    ])
      .then(([t, p, y, h]) => { setTrend(t); setPeaks(p); setYoy(y); setHeatmap(h); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLayout title="Seasonal Trends"><LoadingSpinner rows={8} /></PageLayout>;
  if (error) return (
    <PageLayout title="Seasonal Trends">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
    </PageLayout>
  );

  // Build multi-line data: one row per month, one key per category
  const allCategories = Array.from(new Set(trend.map((t) => t.category)));
  const trendData = MONTH_ORDER.map((month) => {
    const row: Record<string, string | number> = { month };
    allCategories.forEach((cat) => {
      const found = trend.find((t) => t.month === month && t.category === cat);
      row[cat] = found ? found.units_sold : 0;
    });
    return row;
  });

  // YoY chart data
  const yoy2024 = yoy.filter((y) => y.year === 2024);
  const yoy2023 = yoy.filter((y) => y.year === 2023);
  const yoyData = MONTH_ORDER.map((month) => ({
    month,
    '2024': yoy2024.find((y) => y.month === month)?.revenue ?? 0,
    '2023': yoy2023.find((y) => y.month === month)?.revenue ?? 0,
  }));

  // Heatmap: max units for intensity
  const maxUnits = Math.max(...heatmap.map((h) => h.units_sold), 1);

  function toggleCategory(cat: string) {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <PageLayout title="Seasonal Trends">
      {/* Category multi-select filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {allCategories.map((cat, i) => {
          const hidden = hiddenCategories.has(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={{
                backgroundColor: hidden ? '#f3f4f6' : COLORS[i % COLORS.length],
                borderColor: hidden ? '#e5e7eb' : COLORS[i % COLORS.length],
                color: hidden ? '#6b7280' : '#fff',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Multi-line trend chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Monthly Units Sold by Category</h2>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {allCategories
              .filter((cat) => !hiddenCategories.has(cat))
              .map((cat) => (
                <Line
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  stroke={COLORS[allCategories.indexOf(cat) % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Peak months table */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm overflow-auto">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Peak Months per Category</h2>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="text-left px-2 py-2 text-xs text-gray-500 font-semibold uppercase">Category</th>
                <th className="text-right px-2 py-2 text-xs text-gray-500 font-semibold uppercase">Peak Month</th>
                <th className="text-right px-2 py-2 text-xs text-gray-500 font-semibold uppercase">Peak Units</th>
                <th className="text-right px-2 py-2 text-xs text-gray-500 font-semibold uppercase">Seasonal Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {peaks.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-2 py-2 font-medium text-gray-800">{p.category}</td>
                  <td className="px-2 py-2 text-right text-gray-700">{p.peak_month}</td>
                  <td className="px-2 py-2 text-right text-gray-700">{p.peak_units.toLocaleString()}</td>
                  <td className="px-2 py-2 text-right">
                    <span className={`font-semibold ${
                      p.seasonal_index >= 130 ? 'text-emerald-600'
                        : p.seasonal_index >= 110 ? 'text-yellow-600'
                        : 'text-gray-600'
                    }`}>
                      {p.seasonal_index}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* YoY comparison */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Year-over-Year Revenue Comparison</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={yoyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="2024" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="2023" stroke="#9ca3af" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Demand Heatmap */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-2">Daily Demand Heatmap — 2024</h2>
        <p className="text-xs text-gray-400 mb-4">Each cell = one day. Color intensity = units sold.</p>
        <div className="flex gap-1">
          {/* Day labels column */}
          <div className="flex flex-col gap-0.5 mr-1" style={{ marginTop: '18px' }}>
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-xs text-gray-400 leading-none" style={{ height: '10px', lineHeight: '10px', fontSize: '9px', width: '24px' }}>
                {d}
              </div>
            ))}
          </div>
          {/* Grid: columns = weeks, rows = days */}
          <div className="overflow-x-auto flex-1">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(53, 10px)', gridTemplateRows: 'repeat(7, 10px)', gap: '1px' }}>
              {Array.from({ length: 53 * 7 }, (_, idx) => {
                const week = Math.floor(idx / 7);
                const day = idx % 7;
                const cell = heatmap.find((h) => h.week === week && h.day_of_week === day);
                const intensity = cell ? cell.units_sold / maxUnits : 0;
                return (
                  <div
                    key={idx}
                    title={cell ? `${cell.sale_date}: ${cell.units_sold} units` : ''}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '2px',
                      backgroundColor: cell
                        ? `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`
                        : '#f3f4f6',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-gray-400">Low</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9, 1.0].map((v) => (
            <div key={v} style={{ width: '14px', height: '14px', borderRadius: '2px', backgroundColor: `rgba(59, 130, 246, ${v})` }} />
          ))}
          <span className="text-xs text-gray-400">High</span>
        </div>
      </div>
    </PageLayout>
  );
}
