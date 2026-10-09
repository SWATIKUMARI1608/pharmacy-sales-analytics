from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db
from models import Sale, Medicine, Category
from schemas import CategoryRevenue, CategoryMonthly, CategoryGrowth

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("/revenue-share", response_model=List[CategoryRevenue])
def category_revenue_share(
    year: int = Query(2024),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            Category.name.label("category"),
            func.round(func.sum(Sale.total_price), 2).label("revenue"),
        )
        .join(Medicine, Medicine.category_id == Category.id)
        .join(Sale, Sale.medicine_id == Medicine.id)
        .filter(func.strftime("%Y", Sale.sale_date) == str(year))
        .group_by(Category.id)
        .order_by(func.sum(Sale.total_price).desc())
        .all()
    )
    total = sum(float(r.revenue) for r in rows) or 1
    return [
        CategoryRevenue(
            category=r.category,
            revenue=float(r.revenue),
            percentage=round(float(r.revenue) / total * 100, 2),
        )
        for r in rows
    ]


@router.get("/monthly", response_model=List[CategoryMonthly])
def category_monthly(
    year: int = Query(2024),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            func.strftime("%Y-%m", Sale.sale_date).label("month"),
            Category.name.label("category"),
            func.round(func.sum(Sale.total_price), 2).label("revenue"),
        )
        .join(Medicine, Medicine.category_id == Category.id)
        .join(Sale, Sale.medicine_id == Medicine.id)
        .filter(func.strftime("%Y", Sale.sale_date) == str(year))
        .group_by(func.strftime("%Y-%m", Sale.sale_date), Category.id)
        .order_by("month", "category")
        .all()
    )
    return [
        CategoryMonthly(month=r.month, category=r.category, revenue=float(r.revenue))
        for r in rows
    ]


@router.get("/growth", response_model=List[CategoryGrowth])
def category_growth(
    year: int = Query(2024),
    db: Session = Depends(get_db),
):
    # Get last two months of data for the requested year
    months_rows = (
        db.query(func.strftime("%Y-%m", Sale.sale_date).label("month"))
        .filter(func.strftime("%Y", Sale.sale_date) == str(year))
        .distinct()
        .order_by(func.strftime("%Y-%m", Sale.sale_date).desc())
        .limit(2)
        .all()
    )
    if len(months_rows) < 2:
        return []

    current_month = months_rows[0].month
    previous_month = months_rows[1].month

    def month_revenue(month_str: str):
        return (
            db.query(
                Category.name.label("category"),
                func.round(func.sum(Sale.total_price), 2).label("revenue"),
            )
            .join(Medicine, Medicine.category_id == Category.id)
            .join(Sale, Sale.medicine_id == Medicine.id)
            .filter(func.strftime("%Y-%m", Sale.sale_date) == month_str)
            .group_by(Category.id)
            .all()
        )

    current_data = {r.category: float(r.revenue) for r in month_revenue(current_month)}
    previous_data = {r.category: float(r.revenue) for r in month_revenue(previous_month)}

    results = []
    for cat in set(list(current_data.keys()) + list(previous_data.keys())):
        cur = current_data.get(cat, 0)
        prev = previous_data.get(cat, 0)
        if prev > 0:
            growth = round((cur - prev) / prev * 100, 2)
        else:
            growth = None
        results.append(
            CategoryGrowth(
                category=cat,
                this_month_revenue=cur,
                last_month_revenue=prev,
                mom_growth_pct=growth,
            )
        )
    return sorted(results, key=lambda x: x.this_month_revenue, reverse=True)
