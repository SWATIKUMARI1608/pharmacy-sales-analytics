from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db
from models import Sale, Medicine, Category
from schemas import SeasonalMonthlyTrend, PeakMonth, YoYComparison, HeatmapCell

router = APIRouter(prefix="/api/seasonal", tags=["Seasonal"])

MONTH_NAMES = {
    "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
    "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
}


@router.get("/monthly-trend", response_model=List[SeasonalMonthlyTrend])
def monthly_trend(
    year: int = Query(2024),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            func.strftime("%m", Sale.sale_date).label("month_num"),
            Category.name.label("category"),
            func.sum(Sale.quantity).label("units_sold"),
        )
        .join(Medicine, Medicine.category_id == Category.id)
        .join(Sale, Sale.medicine_id == Medicine.id)
        .filter(func.strftime("%Y", Sale.sale_date) == str(year))
        .group_by(func.strftime("%m", Sale.sale_date), Category.id)
        .order_by("month_num", "category")
        .all()
    )
    return [
        SeasonalMonthlyTrend(
            month=MONTH_NAMES.get(r.month_num, r.month_num),
            category=r.category,
            units_sold=int(r.units_sold),
        )
        for r in rows
    ]


@router.get("/peak-months", response_model=List[PeakMonth])
def peak_months(
    year: int = Query(2024),
    db: Session = Depends(get_db),
):
    # Get monthly units per category
    rows = (
        db.query(
            Category.name.label("category"),
            func.strftime("%m", Sale.sale_date).label("month_num"),
            func.sum(Sale.quantity).label("units_sold"),
        )
        .join(Medicine, Medicine.category_id == Category.id)
        .join(Sale, Sale.medicine_id == Medicine.id)
        .filter(func.strftime("%Y", Sale.sale_date) == str(year))
        .group_by(Category.id, func.strftime("%m", Sale.sale_date))
        .all()
    )

    # Aggregate per category
    from collections import defaultdict
    cat_monthly: dict = defaultdict(dict)
    for r in rows:
        cat_monthly[r.category][r.month_num] = int(r.units_sold)

    results = []
    for cat, monthly in cat_monthly.items():
        if not monthly:
            continue
        peak_m = max(monthly, key=lambda m: monthly[m])
        peak_units = monthly[peak_m]
        avg = sum(monthly.values()) / len(monthly)
        seasonal_index = round((peak_units / avg) * 100, 1) if avg else 0
        results.append(
            PeakMonth(
                category=cat,
                peak_month=MONTH_NAMES.get(peak_m, peak_m),
                peak_units=peak_units,
                seasonal_index=seasonal_index,
            )
        )
    return sorted(results, key=lambda x: x.seasonal_index, reverse=True)


@router.get("/yoy-comparison", response_model=List[YoYComparison])
def yoy_comparison(db: Session = Depends(get_db)):
    rows = (
        db.query(
            func.strftime("%Y", Sale.sale_date).label("year"),
            func.strftime("%m", Sale.sale_date).label("month_num"),
            func.round(func.sum(Sale.total_price), 2).label("revenue"),
        )
        .filter(func.strftime("%Y", Sale.sale_date).in_(["2023", "2024"]))
        .group_by(
            func.strftime("%Y", Sale.sale_date),
            func.strftime("%m", Sale.sale_date),
        )
        .order_by("year", "month_num")
        .all()
    )
    return [
        YoYComparison(
            month=MONTH_NAMES.get(r.month_num, r.month_num),
            year=int(r.year),
            revenue=float(r.revenue),
        )
        for r in rows
    ]


@router.get("/heatmap", response_model=List[HeatmapCell])
def heatmap(
    year: int = Query(2024),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            Sale.sale_date,
            func.sum(Sale.quantity).label("units_sold"),
        )
        .filter(func.strftime("%Y", Sale.sale_date) == str(year))
        .group_by(Sale.sale_date)
        .order_by(Sale.sale_date)
        .all()
    )

    from datetime import date, timedelta
    year_start = date(year, 1, 1)
    results = []
    for r in rows:
        d = r.sale_date
        delta = (d - year_start).days
        week = delta // 7
        day_of_week = d.weekday()  # 0=Mon, 6=Sun
        results.append(
            HeatmapCell(
                week=week,
                day_of_week=day_of_week,
                units_sold=int(r.units_sold),
                sale_date=d.isoformat(),
            )
        )
    return results
