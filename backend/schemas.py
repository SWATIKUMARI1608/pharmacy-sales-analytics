from pydantic import BaseModel
from typing import Optional


# ── Category ──────────────────────────────────────────────
class CategorySchema(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


# ── KPI ───────────────────────────────────────────────────
class KPISummary(BaseModel):
    total_revenue: float
    total_units_sold: int
    total_medicines: int
    top_medicine_name: str
    low_stock_count: int


# ── Sales ─────────────────────────────────────────────────
class SalesOverTime(BaseModel):
    month: str
    revenue: float


class TopMedicine(BaseModel):
    medicine_name: str
    category: str
    revenue: float
    units_sold: int


class SalesByType(BaseModel):
    otc_revenue: float
    prescription_revenue: float
    otc_units: int
    prescription_units: int


class MedicineDetail(BaseModel):
    medicine_name: str
    category: str
    units_sold: int
    revenue: float
    margin_pct: float


# ── Categories ────────────────────────────────────────────
class CategoryRevenue(BaseModel):
    category: str
    revenue: float
    percentage: float


class CategoryMonthly(BaseModel):
    month: str
    category: str
    revenue: float


class CategoryGrowth(BaseModel):
    category: str
    this_month_revenue: float
    last_month_revenue: float
    mom_growth_pct: Optional[float]


# ── Seasonal ──────────────────────────────────────────────
class SeasonalMonthlyTrend(BaseModel):
    month: str
    category: str
    units_sold: int


class PeakMonth(BaseModel):
    category: str
    peak_month: str
    peak_units: int
    seasonal_index: float


class YoYComparison(BaseModel):
    month: str
    year: int
    revenue: float


class HeatmapCell(BaseModel):
    week: int
    day_of_week: int
    units_sold: int
    sale_date: str
