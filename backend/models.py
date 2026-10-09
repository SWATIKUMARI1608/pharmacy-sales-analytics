from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    medicines = relationship("Medicine", back_populates="category")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    generic_name = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    unit_price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    unit_type = Column(String, default="tablet")

    category = relationship("Category", back_populates="medicines")
    sales = relationship("Sale", back_populates="medicine")
    inventory = relationship("Inventory", back_populates="medicine", uselist=False)


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    stock_quantity = Column(Integer, default=0)
    reorder_level = Column(Integer, default=50)
    expiry_date = Column(Date, nullable=True)

    medicine = relationship("Medicine", back_populates="inventory")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    sale_date = Column(Date, nullable=False)
    sale_type = Column(String, default="OTC")  # OTC or Prescription

    medicine = relationship("Medicine", back_populates="sales")
