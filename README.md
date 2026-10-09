# Pharmacy Sales Analytics Dashboard

A full-stack pharmacy sales analytics web application built with FastAPI + SQLite (backend) and React + TypeScript + Recharts (frontend).

## Features

- **KPI Overview** — total revenue, units sold, low-stock alerts, OTC vs Prescription split
- **Medicine Sales** — sortable/filterable table, top medicines bar chart, date range selector
- **Category Breakdown** — donut chart, stacked monthly bar chart, MoM growth table
- **Seasonal Trends** — multi-line trend chart, peak months, YoY comparison, daily demand heatmap

## Prerequisites

- Python 3.11+
- Node.js 18+

## Setup & Run

### Backend

```bash
cd backend
pip install -r requirements.txt
python seed.py          # Creates pharmacy.db and seeds 2 years of data
uvicorn main:app --reload
```

Backend runs on **http://localhost:8000**  
Swagger API docs: **http://localhost:8000/docs**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

## Project Structure

```
pharmacy-analytics/
├── backend/
│   ├── main.py               # FastAPI app + CORS
│   ├── database.py           # SQLite engine + session
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic response schemas
│   ├── seed.py               # Seeds pharmacy.db with realistic data
│   ├── requirements.txt
│   └── routers/
│       ├── kpi.py            # GET /api/kpi/summary
│       ├── sales.py          # GET /api/sales/*
│       ├── categories.py     # GET /api/categories/*
│       └── seasonal.py       # GET /api/seasonal/*
└── frontend/
    └── src/
        ├── api/              # Axios fetch functions
        ├── components/       # KpiCard, PageLayout, LoadingSpinner
        ├── pages/            # Overview, MedicineSales, Categories, SeasonalTrends
        └── types/            # TypeScript interfaces
```

## Data

- 10 medicine categories with realistic seasonal patterns
- 58 medicines with cost/unit prices
- ~21,000 sales records for 2024 + ~21,000 for 2023 (for YoY comparison)
- Seasonal spikes baked in: Cough & Cold peaks Dec, Antihistamines peaks Apr, Vitamins peaks Jan
