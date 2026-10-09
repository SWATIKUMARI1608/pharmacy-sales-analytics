import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import PageLayout from '../components/PageLayout';
import KpiCard from '../components/KpiCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchKPISummary } from '../api/kpi';
import { fetchSalesOverTime, fetchSalesByType, fetchTopMedicines } from '../api/sales';
import type { KPISummary, SalesOverTime, SalesByType, TopMedicine } from '../types';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4',
  '#84cc16', '#f97316', '#ec4899', '#6366f1'];

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(1)}K`
    : `$${n.toFixed(2)}`;

export default function Overview() {
  const [kpi, setKpi] = useState<KPISummary | null>(null);
  const [overTime, setOverTime] = useState<SalesOverTime[]>([]);
  const [byType, setByType] = useState<SalesByType | null>(null);
  const [topMeds, setTopMeds] = useState<TopMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchKPISummary(),
      fetchSalesOverTime(),
      fetchSalesByType(),
      fetchTopMedicines(10),
    ])
      .then(([k, ot, bt, tm]) => {
        setKpi(k);
        setOverTime(ot);
        setByType(bt);
        setTopMeds(tm);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLayout title="Overview"><LoadingSpinner rows={8} /></PageLayout>;
  if (error)
    return (
      <PageLayout title="Overview">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
      </PageLayout>
    );

  const pieData = byType
    ? [
        { name: 'OTC', value: byType.otc_revenue },
        { name: 'Prescription', value: byType.prescription_revenue },
      ]
    : [];

  return (
    <PageLayout title="Sales Overview — 2024">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Total Revenue (YTD)"
          value={fmt(kpi!.total_revenue)}
          subLabel="Full year 2024"
          accent="bg-blue-500"
        />
        <KpiCard
          label="Units Sold"
          value={kpi!.total_units_sold.toLocaleString()}
          subLabel="All products"
          accent="bg-purple-500"
        />
        <KpiCard
          label="Total Medicines"
          value={kpi!.total_medicines}
          subLabel="In catalogue"
          accent="bg-emerald-500"
        />
        <KpiCard
          label="Low Stock Alerts"
          value={kpi!.low_stock_count}
          subLabel="Below reorder level"
          accent="bg-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Revenue Over Time */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={overTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* OTC vs Prescription */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">OTC vs Prescription Revenue</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                dataKey="value"
                label={(props: PieLabelRenderProps) => {
                  const { name, percent } = props;
                  return `${String(name ?? '')} ${(((percent as number) ?? 0) * 100).toFixed(1)}%`;
                }}
                labelLine={false}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 Medicines */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Top 10 Medicines by Revenue</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topMeds} layout="vertical" margin={{ left: 130 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="medicine_name" tick={{ fontSize: 11 }} width={130} />
            <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]}>
              {topMeds.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </PageLayout>
  );
}
