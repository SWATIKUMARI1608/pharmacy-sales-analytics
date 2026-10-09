// KPI
export interface KPISummary {
  total_revenue: number;
  total_units_sold: number;
  total_medicines: number;
  top_medicine_name: string;
  low_stock_count: number;
}

// Sales
export interface SalesOverTime {
  month: string;
  revenue: number;
}

export interface TopMedicine {
  medicine_name: string;
  category: string;
  revenue: number;
  units_sold: number;
}

export interface SalesByType {
  otc_revenue: number;
  prescription_revenue: number;
  otc_units: number;
  prescription_units: number;
}

export interface MedicineDetail {
  medicine_name: string;
  category: string;
  units_sold: number;
  revenue: number;
  margin_pct: number;
}

// Categories
export interface CategoryRevenue {
  category: string;
  revenue: number;
  percentage: number;
}

export interface CategoryMonthly {
  month: string;
  category: string;
  revenue: number;
}

export interface CategoryGrowth {
  category: string;
  this_month_revenue: number;
  last_month_revenue: number;
  mom_growth_pct: number | null;
}

// Seasonal
export interface SeasonalMonthlyTrend {
  month: string;
  category: string;
  units_sold: number;
}

export interface PeakMonth {
  category: string;
  peak_month: string;
  peak_units: number;
  seasonal_index: number;
}

export interface YoYComparison {
  month: string;
  year: number;
  revenue: number;
}

export interface HeatmapCell {
  week: number;
  day_of_week: number;
  units_sold: number;
  sale_date: string;
}
