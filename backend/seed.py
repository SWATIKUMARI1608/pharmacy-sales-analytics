"""
Seed script — creates all tables and populates with 12 months of realistic
pharmacy sales data (Jan 2024 – Dec 2024) plus a partial 2023 set for YoY.
Run from inside backend/:  python seed.py
"""
import random
from datetime import date, timedelta
from database import engine, SessionLocal, Base
from models import Category, Medicine, Inventory, Sale

random.seed(42)

# ── Seasonal multipliers per category per month (1 = baseline) ──────────────
# Keys are exact category names defined below
SEASONAL = {
    "Cough & Cold":      [1.2, 1.1, 0.8, 0.6, 0.5, 0.4, 0.4, 0.5, 0.8, 1.1, 1.5, 1.6],
    "Antihistamines":    [0.6, 0.7, 1.4, 1.8, 1.6, 1.0, 0.7, 0.7, 0.9, 0.8, 0.6, 0.5],
    "Vitamins":          [1.6, 1.3, 1.1, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.0, 1.2, 1.4],
    "Antibiotics":       [1.1, 1.0, 0.9, 0.9, 0.9, 0.8, 0.8, 0.9, 1.0, 1.0, 1.1, 1.2],
    "Analgesics":        [1.0, 1.0, 1.0, 1.0, 1.0, 1.1, 1.2, 1.1, 1.0, 1.0, 1.0, 1.0],
    "Cardiovascular":    [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    "Diabetes":          [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    "Dermatology":       [0.7, 0.7, 0.9, 1.1, 1.3, 1.5, 1.6, 1.5, 1.2, 0.9, 0.7, 0.7],
    "Antacids":          [1.0, 1.0, 1.1, 1.1, 1.2, 1.3, 1.4, 1.3, 1.1, 1.0, 1.0, 1.0],
    "OTC Supplements":   [1.3, 1.1, 1.0, 0.9, 0.9, 0.8, 0.8, 0.9, 1.0, 1.0, 1.1, 1.3],
}

CATEGORIES = list(SEASONAL.keys())

# ── Medicine definitions [name, generic_name, category, unit_price, cost_price, unit_type] ──
MEDICINES_DATA = [
    # Antibiotics
    ("Amoxil 500mg", "Amoxicillin", "Antibiotics", 12.50, 7.50, "capsule"),
    ("Augmentin 625mg", "Amoxicillin+Clavulanate", "Antibiotics", 22.00, 14.00, "tablet"),
    ("Azithral 500mg", "Azithromycin", "Antibiotics", 18.00, 11.00, "tablet"),
    ("Ciprobay 500mg", "Ciprofloxacin", "Antibiotics", 15.00, 9.00, "tablet"),
    ("Doxycycline 100mg", "Doxycycline", "Antibiotics", 10.00, 6.00, "capsule"),
    ("Metronidazole 400mg", "Metronidazole", "Antibiotics", 8.00, 4.50, "tablet"),
    # Analgesics
    ("Panadol 500mg", "Paracetamol", "Analgesics", 5.00, 2.50, "tablet"),
    ("Brufen 400mg", "Ibuprofen", "Analgesics", 7.00, 3.50, "tablet"),
    ("Voltaren 50mg", "Diclofenac", "Analgesics", 9.00, 5.00, "tablet"),
    ("Tramadol 50mg", "Tramadol", "Analgesics", 14.00, 8.00, "capsule"),
    ("Aspirin 300mg", "Aspirin", "Analgesics", 4.00, 2.00, "tablet"),
    ("Naproxen 250mg", "Naproxen", "Analgesics", 8.50, 4.50, "tablet"),
    # Vitamins
    ("Vitamin C 500mg", "Ascorbic Acid", "Vitamins", 6.00, 3.00, "tablet"),
    ("Vitamin D3 1000IU", "Cholecalciferol", "Vitamins", 10.00, 5.50, "capsule"),
    ("Vitamin B Complex", "B-vitamins", "Vitamins", 8.00, 4.00, "tablet"),
    ("Zinc 20mg", "Zinc Sulphate", "Vitamins", 7.00, 3.50, "tablet"),
    ("Folic Acid 5mg", "Folic Acid", "Vitamins", 5.00, 2.50, "tablet"),
    ("Omega-3 1000mg", "Fish Oil", "Vitamins", 15.00, 8.00, "capsule"),
    # Cardiovascular
    ("Atenolol 50mg", "Atenolol", "Cardiovascular", 11.00, 6.00, "tablet"),
    ("Amlodipine 5mg", "Amlodipine", "Cardiovascular", 13.00, 7.00, "tablet"),
    ("Lisinopril 10mg", "Lisinopril", "Cardiovascular", 12.00, 6.50, "tablet"),
    ("Atorvastatin 20mg", "Atorvastatin", "Cardiovascular", 20.00, 12.00, "tablet"),
    ("Metoprolol 50mg", "Metoprolol", "Cardiovascular", 14.00, 8.00, "tablet"),
    ("Losartan 50mg", "Losartan", "Cardiovascular", 16.00, 9.00, "tablet"),
    # Cough & Cold
    ("Benadryl Cough Syrup", "Diphenhydramine", "Cough & Cold", 9.00, 4.50, "syrup"),
    ("Mucaine Gel", "Antacid+Oxethazaine", "Cough & Cold", 11.00, 6.00, "syrup"),
    ("Dextromethorphan 15mg", "Dextromethorphan", "Cough & Cold", 8.00, 4.00, "tablet"),
    ("Salbutamol Inhaler", "Salbutamol", "Cough & Cold", 25.00, 15.00, "inhaler"),
    ("Pseudoephedrine 60mg", "Pseudoephedrine", "Cough & Cold", 7.00, 3.50, "tablet"),
    ("Bromhexine 8mg", "Bromhexine", "Cough & Cold", 6.50, 3.20, "tablet"),
    # Diabetes
    ("Metformin 500mg", "Metformin", "Diabetes", 9.00, 4.50, "tablet"),
    ("Glibenclamide 5mg", "Glibenclamide", "Diabetes", 10.00, 5.50, "tablet"),
    ("Insulin Glargine", "Insulin Glargine", "Diabetes", 45.00, 30.00, "injection"),
    ("Januvia 100mg", "Sitagliptin", "Diabetes", 35.00, 22.00, "tablet"),
    ("Empagliflozin 10mg", "Empagliflozin", "Diabetes", 40.00, 26.00, "tablet"),
    ("Acarbose 50mg", "Acarbose", "Diabetes", 18.00, 10.00, "tablet"),
    # Dermatology
    ("Hydrocortisone Cream", "Hydrocortisone", "Dermatology", 8.00, 4.00, "cream"),
    ("Clotrimazole Cream", "Clotrimazole", "Dermatology", 7.00, 3.50, "cream"),
    ("Betamethasone Cream", "Betamethasone", "Dermatology", 10.00, 5.50, "cream"),
    ("Tretinoin 0.05%", "Tretinoin", "Dermatology", 18.00, 10.00, "cream"),
    ("Sunscreen SPF50", "Zinc Oxide", "Dermatology", 20.00, 11.00, "lotion"),
    ("Calamine Lotion", "Calamine", "Dermatology", 6.00, 3.00, "lotion"),
    # Antacids
    ("Omeprazole 20mg", "Omeprazole", "Antacids", 10.00, 5.00, "capsule"),
    ("Ranitidine 150mg", "Ranitidine", "Antacids", 8.00, 4.00, "tablet"),
    ("Pantoprazole 40mg", "Pantoprazole", "Antacids", 12.00, 6.50, "tablet"),
    ("Gaviscon Liquid", "Alginate", "Antacids", 14.00, 7.50, "syrup"),
    ("Antacid Plus Tablet", "Magnesium Hydroxide", "Antacids", 5.00, 2.50, "tablet"),
    # Antihistamines
    ("Cetirizine 10mg", "Cetirizine", "Antihistamines", 6.00, 3.00, "tablet"),
    ("Loratadine 10mg", "Loratadine", "Antihistamines", 7.00, 3.50, "tablet"),
    ("Fexofenadine 120mg", "Fexofenadine", "Antihistamines", 12.00, 6.50, "tablet"),
    ("Chlorphenamine 4mg", "Chlorphenamine", "Antihistamines", 4.50, 2.20, "tablet"),
    ("Promethazine 25mg", "Promethazine", "Antihistamines", 8.00, 4.00, "tablet"),
    # OTC Supplements
    ("Calcium 600mg", "Calcium Carbonate", "OTC Supplements", 9.00, 4.50, "tablet"),
    ("Iron 65mg", "Ferrous Sulphate", "OTC Supplements", 7.00, 3.50, "tablet"),
    ("Magnesium 250mg", "Magnesium Oxide", "OTC Supplements", 8.00, 4.00, "tablet"),
    ("Probiotics Capsule", "Lactobacillus", "OTC Supplements", 16.00, 9.00, "capsule"),
    ("Melatonin 3mg", "Melatonin", "OTC Supplements", 12.00, 6.50, "capsule"),
    ("Collagen Peptides", "Hydrolysed Collagen", "OTC Supplements", 25.00, 15.00, "sachet"),
]

# Base daily units per medicine (before seasonal multiplier)
BASE_DAILY_UNITS = {
    "Antibiotics": 8, "Analgesics": 15, "Vitamins": 12,
    "Cardiovascular": 7, "Cough & Cold": 10, "Diabetes": 6,
    "Dermatology": 5, "Antacids": 9, "Antihistamines": 8,
    "OTC Supplements": 6,
}


def generate_sales(medicines_by_cat, year: int, volume_factor: float = 1.0):
    sales = []
    start = date(year, 1, 1)
    end = date(year, 12, 31)
    current = start
    while current <= end:
        month_idx = current.month - 1
        for cat_name, med_list in medicines_by_cat.items():
            seasonal_mult = SEASONAL[cat_name][month_idx]
            base = BASE_DAILY_UNITS[cat_name]
            for med in med_list:
                # Add some randomness ±30%
                units = max(1, int(base * seasonal_mult * volume_factor * random.uniform(0.7, 1.3)))
                sale_type = "Prescription" if random.random() < 0.30 else "OTC"
                total = round(units * med.unit_price, 2)
                sales.append(Sale(
                    medicine_id=med.id,
                    quantity=units,
                    unit_price=med.unit_price,
                    total_price=total,
                    sale_date=current,
                    sale_type=sale_type,
                ))
        current += timedelta(days=1)
    return sales


def run():
    print("Creating tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # ── Categories ────────────────────────────────────────
    print("Seeding categories...")
    cat_objects = {}
    for cat_name in CATEGORIES:
        c = Category(name=cat_name)
        db.add(c)
        cat_objects[cat_name] = c
    db.flush()

    # ── Medicines ─────────────────────────────────────────
    print("Seeding medicines...")
    medicines_by_cat: dict[str, list] = {c: [] for c in CATEGORIES}
    for name, generic, cat_name, unit_price, cost_price, unit_type in MEDICINES_DATA:
        m = Medicine(
            name=name,
            generic_name=generic,
            category_id=cat_objects[cat_name].id,
            unit_price=unit_price,
            cost_price=cost_price,
            unit_type=unit_type,
        )
        db.add(m)
        medicines_by_cat[cat_name].append(m)
    db.flush()

    # ── Inventory ─────────────────────────────────────────
    print("Seeding inventory...")
    for med_list in medicines_by_cat.values():
        for med in med_list:
            stock = random.randint(10, 500)
            reorder = random.randint(30, 80)
            inv = Inventory(
                medicine_id=med.id,
                stock_quantity=stock,
                reorder_level=reorder,
                expiry_date=date(2025, random.randint(3, 12), random.randint(1, 28)),
            )
            db.add(inv)
    db.flush()

    # ── Sales 2024 (full year) ────────────────────────────
    print("Seeding 2024 sales (this may take a moment)...")
    sales_2024 = generate_sales(medicines_by_cat, 2024, volume_factor=1.0)
    for s in sales_2024:
        db.add(s)

    # ── Sales 2023 (full year, slightly lower volume) ─────
    print("Seeding 2023 sales...")
    sales_2023 = generate_sales(medicines_by_cat, 2023, volume_factor=0.85)
    for s in sales_2023:
        db.add(s)

    db.commit()
    print(f"Done! Categories: {len(CATEGORIES)}, Medicines: {len(MEDICINES_DATA)}")
    print(f"   Sales 2024: {len(sales_2024):,}  |  Sales 2023: {len(sales_2023):,}")
    db.close()


if __name__ == "__main__":
    run()
