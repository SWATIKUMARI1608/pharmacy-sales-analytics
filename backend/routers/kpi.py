from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Sale, Medicine, Inventory
from schemas import KPISummary

router = APIRouter(prefix="/api/kpi", tags=["KPI"])


@router.get("/summary", response_model=KPISummary)
def get_kpi_summary(db: Session = Depends(get_db)):
    # Total revenue and units — 2024 only
    result = db.query(
        func.round(func.sum(Sale.total_price), 2),
        func.sum(Sale.quantity),
    ).filter(
        func.strftime("%Y", Sale.sale_date) == "2024"
    ).one()

    total_revenue = float(result[0] or 0)
    total_units_sold = int(result[1] or 0)

    # Total medicines
    total_medicines = db.query(func.count(Medicine.id)).scalar()

    # Top medicine by revenue in 2024
    top = (
        db.query(Medicine.name, func.sum(Sale.total_price).label("rev"))
        .join(Sale, Sale.medicine_id == Medicine.id)
        .filter(func.strftime("%Y", Sale.sale_date) == "2024")
        .group_by(Medicine.id)
        .order_by(func.sum(Sale.total_price).desc())
        .first()
    )
    top_medicine_name = top[0] if top else "N/A"

    # Low stock count (stock < reorder_level)
    low_stock_count = (
        db.query(func.count(Inventory.id))
        .filter(Inventory.stock_quantity < Inventory.reorder_level)
        .scalar()
    )

    return KPISummary(
        total_revenue=round(total_revenue, 2),
        total_units_sold=total_units_sold,
        total_medicines=total_medicines,
        top_medicine_name=top_medicine_name,
        low_stock_count=int(low_stock_count or 0),
    )
