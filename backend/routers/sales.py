from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from database import get_db
from models import Sale, Medicine, Category
from schemas import SalesOverTime, TopMedicine, SalesByType, MedicineDetail

router = APIRouter(prefix="/api/sales", tags=["Sales"])


@router.get("/over-time", response_model=List[SalesOverTime])
def sales_over_time(
    year: int = Query(2024),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            func.strftime("%Y-%m", Sale.sale_date).label("month"),
            func.round(func.sum(Sale.total_price), 2).label("revenue"),
        )
        .filter(func.strftime("%Y", Sale.sale_date) == str(year))
        .group_by(func.strftime("%Y-%m", Sale.sale_date))
        .order_by("month")
        .all()
    )
    return [SalesOverTime(month=r.month, revenue=float(r.revenue)) for r in rows]


@router.get("/top-medicines", response_model=List[TopMedicine])
def top_medicines(
    limit: int = Query(10, ge=1, le=50),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = (
        db.query(
            Medicine.name.label("medicine_name"),
            Category.name.label("category"),
            func.round(func.sum(Sale.total_price), 2).label("revenue"),
            func.sum(Sale.quantity).label("units_sold"),
        )
        .join(Sale, Sale.medicine_id == Medicine.id)
        .join(Category, Category.id == Medicine.category_id)
        .group_by(Medicine.id)
    )
    if start_date:
        q = q.filter(Sale.sale_date >= start_date)
    else:
        q = q.filter(func.strftime("%Y", Sale.sale_date) == "2024")
    if end_date:
        q = q.filter(Sale.sale_date <= end_date)

    rows = q.order_by(func.sum(Sale.total_price).desc()).limit(limit).all()
    return [
        TopMedicine(
            medicine_name=r.medicine_name,
            category=r.category,
            revenue=float(r.revenue),
            units_sold=int(r.units_sold),
        )
        for r in rows
    ]


@router.get("/by-type", response_model=SalesByType)
def sales_by_type(
    year: int = Query(2024),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            Sale.sale_type,
            func.round(func.sum(Sale.total_price), 2).label("revenue"),
            func.sum(Sale.quantity).label("units"),
        )
        .filter(func.strftime("%Y", Sale.sale_date) == str(year))
        .group_by(Sale.sale_type)
        .all()
    )
    data = {r.sale_type: (float(r.revenue), int(r.units)) for r in rows}
    return SalesByType(
        otc_revenue=data.get("OTC", (0, 0))[0],
        prescription_revenue=data.get("Prescription", (0, 0))[0],
        otc_units=data.get("OTC", (0, 0))[1],
        prescription_units=data.get("Prescription", (0, 0))[1],
    )


@router.get("/medicines", response_model=List[MedicineDetail])
def medicines_detail(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    sale_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = (
        db.query(
            Medicine.name.label("medicine_name"),
            Category.name.label("category"),
            func.sum(Sale.quantity).label("units_sold"),
            func.round(func.sum(Sale.total_price), 2).label("revenue"),
            Medicine.unit_price,
            Medicine.cost_price,
        )
        .join(Sale, Sale.medicine_id == Medicine.id)
        .join(Category, Category.id == Medicine.category_id)
        .group_by(Medicine.id)
    )
    if start_date:
        q = q.filter(Sale.sale_date >= start_date)
    else:
        q = q.filter(func.strftime("%Y", Sale.sale_date) == "2024")
    if end_date:
        q = q.filter(Sale.sale_date <= end_date)
    if sale_type and sale_type in ("OTC", "Prescription"):
        q = q.filter(Sale.sale_type == sale_type)

    rows = q.order_by(func.sum(Sale.total_price).desc()).all()
    results = []
    for r in rows:
        margin = round(((r.unit_price - r.cost_price) / r.unit_price) * 100, 2) if r.unit_price else 0
        results.append(
            MedicineDetail(
                medicine_name=r.medicine_name,
                category=r.category,
                units_sold=int(r.units_sold),
                revenue=float(r.revenue),
                margin_pct=margin,
            )
        )
    return results
