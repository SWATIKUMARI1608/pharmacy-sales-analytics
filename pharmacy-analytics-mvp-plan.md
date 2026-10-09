# Pharmacy Sales Analytics Dashboard — MVP Plan

## Top-Level Overview

Build a full-stack web application for pharmacy sales analytics running on localhost.

- **Backend:** Python + FastAPI, SQLite database (file-based, zero config)
- **Frontend:** React + TypeScript, Recharts for visualizations, TailwindCSS for UI
- **Scope:** MVP covering KPI Overview, Medicine Sales, Category Breakdown, and Seasonal Trends
- **Data:** Realistic pre-loaded seed data — medicines, categories, 12 months of sales records
- **No AI/ML features** — pure data analytics and aggregations

The app runs with two terminal commands: `uvicorn` for the backend (port 8000) and `npm run dev` for the frontend (port 5173).

---

## Project Structure

```
pharmacy-analytics/
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── database.py           # SQLite connection + SQLAlchemy setup
│   ├── models.py             # ORM models
│   ├── schemas.py            # Pydantic response schemas
│   ├── routers/
│   │   ├── kpi.py            # KPI overview endpoints
│   │   ├── sales.py          # Medicine sales endpoints
│   │   ├── categories.py     # Category analytics endpoints
│   │   └── seasonal.py       # Seasonal trend endpoints
│   ├── seed.py               # Seed script — populates SQLite with sample data
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/              # Axios API client functions
│   │   ├── components/       # Reusable UI components (KPI card, chart wrappers)
│   │   ├── pages/            # Page-level components
│   │   │   ├── Overview.tsx
│   │   │   ├── MedicineSales.tsx
│   │   │   ├── Categories.tsx
│   │   │   └── SeasonalTrends.tsx
│   │   └── types/            # TypeScript interfaces matching API schemas
│   ├── package.json
│   └── vite.config.ts
└── pharmacy-analytics-mvp-plan.md
```

---

## Data Model

### Entities

| Table | Key Columns |
|---|---|
| `categories` | id, name, parent_id (nullable for sub-categories) |
| `medicines` | id, name, generic_name, category_id, unit_price, cost_price, unit_type |
| `inventory` | id, medicine_id, stock_quantity, reorder_level, expiry_date |
| `sales` | id, medicine_id, quantity, unit_price, total_price, sale_date, sale_type (OTC/Prescription) |

### Seed Data Shape
- ~10 categories (Antibiotics, Analgesics, Vitamins, Cardiovascular, Cough & Cold, Diabetes, Dermatology, Antacids, Antihistamines, OTC Supplements)
- ~60 medicines spread across categories
- ~3,600 sale records across 12 months (Jan–Dec) with realistic seasonal spikes

---

## Sub-Tasks

---

### Sub-Task 1 — Project Scaffolding

**Status:** `[ ] pending`

**Intent:**
Create the directory structure and install all dependencies for both backend and frontend. Establish the base configuration files so subsequent sub-tasks can build on a runnable skeleton.

**Expected Outcomes:**
- `backend/` folder exists with `requirements.txt` listing FastAPI, SQLAlchemy, uvicorn, and pydantic
- `frontend/` folder is a Vite + React + TypeScript project with TailwindCSS, Recharts, and Axios installed
- Both can be started without errors (backend returns 200 on `/`, frontend renders a placeholder page)
- CORS is configured on the backend to allow requests from `http://localhost:5173`

**Todo List:**
1. Create `backend/` directory and `requirements.txt` with: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `pydantic`, `python-dateutil`
2. Create `backend/main.py` — FastAPI app with CORS middleware allowing `http://localhost:5173`, a root health-check route `GET /`
3. Scaffold `frontend/` using `npm create vite@latest frontend -- --template react-ts`
4. Install frontend dependencies: `npm install axios recharts tailwindcss @tailwindcss/vite react-router-dom`
5. Configure TailwindCSS in `vite.config.ts` and `index.css`
6. Add a top-level navigation shell in `App.tsx` with placeholder routes for the four pages
7. Verify both servers start: `uvicorn main:app --reload` (port 8000) and `npm run dev` (port 5173)

**Relevant Context:**
- FastAPI CORS: `fastapi.middleware.cors.CORSMiddleware`
- Vite proxy is NOT needed — Axios base URL will point directly to `http://localhost:8000`

---

### Sub-Task 2 — Database Models + Seed Data

**Status:** `[ ] pending`

**Intent:**
Define the SQLAlchemy ORM models and populate the SQLite database with 12 months of realistic pharmacy sales data. This is the foundation all API endpoints depend on.

**Expected Outcomes:**
- `database.py` establishes a SQLite engine and session factory using `pharmacy.db` file
- `models.py` defines `Category`, `Medicine`, `Inventory`, `Sale` ORM classes
- `schemas.py` defines Pydantic read schemas for each model
- Running `python seed.py` creates all tables and inserts realistic data:
  - 10 categories, ~60 medicines, ~3,600 sales records spanning Jan 2024 – Dec 2024
  - Seasonal patterns baked into seed: Cough & Cold peaks Nov–Feb, Antihistamines peak Mar–May, Vitamins peak Jan, Diabetes steady year-round
- `pharmacy.db` file is created in `backend/`

**Todo List:**
1. Create `backend/database.py` — SQLite engine (`sqlite:///./pharmacy.db`), `SessionLocal`, `Base`
2. Create `backend/models.py` — four ORM models: `Category`, `Medicine`, `Inventory`, `Sale`
3. Create `backend/schemas.py` — Pydantic schemas for API responses
4. Create `backend/seed.py`:
   - Define 10 category records
   - Define ~60 medicine records with cost_price and unit_price (realistic margins 20–40%)
   - Generate daily sales records across Jan–Dec 2024 with seasonal volume multipliers per category
   - Call `Base.metadata.create_all()` then insert all records in a single session commit
5. Run `python seed.py` and confirm `pharmacy.db` is created and row counts are correct

**Relevant Context:**
- SQLAlchemy declarative base pattern: `Base = declarative_base()`
- Use `ForeignKey` links: `Medicine.category_id → Category.id`, `Sale.medicine_id → Medicine.id`
- `sale_type` column: randomly assign ~70% OTC, ~30% Prescription across records

---

### Sub-Task 3 — Backend API Endpoints

**Status:** `[ ] pending`

**Intent:**
Implement all FastAPI route handlers that the frontend dashboard will consume. All endpoints perform SQL aggregations directly — no ML, no forecasting.

**Expected Outcomes:**
- Four routers registered under `/api/kpi`, `/api/sales`, `/api/categories`, `/api/seasonal`
- All endpoints return JSON matching the Pydantic schemas defined in Sub-Task 2
- Endpoints accept optional query parameters for date range filtering (`start_date`, `end_date`)

**Endpoints to Implement:**

#### `/api/kpi`
| Route | Returns |
|---|---|
| `GET /api/kpi/summary` | total_revenue, total_units_sold, total_medicines, top_medicine_name, low_stock_count |

#### `/api/sales`
| Route | Returns |
|---|---|
| `GET /api/sales/over-time` | list of {date, revenue} aggregated by month |
| `GET /api/sales/top-medicines` | top N medicines by revenue, accepts `?limit=10` |
| `GET /api/sales/by-type` | {otc_revenue, prescription_revenue, otc_units, prescription_units} |
| `GET /api/sales/medicines` | paginated medicine detail table with units_sold, revenue, margin% |

#### `/api/categories`
| Route | Returns |
|---|---|
| `GET /api/categories/revenue-share` | list of {category, revenue, percentage} |
| `GET /api/categories/monthly` | monthly revenue per category — list of {month, category, revenue} |
| `GET /api/categories/growth` | month-over-month growth % per category |

#### `/api/seasonal`
| Route | Returns |
|---|---|
| `GET /api/seasonal/monthly-trend` | list of {month, category, units_sold} for trend lines |
| `GET /api/seasonal/peak-months` | per-category peak month with units and seasonal index score |
| `GET /api/seasonal/yoy-comparison` | monthly revenue for current vs previous year (based on seed data range) |
| `GET /api/seasonal/heatmap` | list of {week, day_of_week, units_sold} for demand calendar heatmap |

**Todo List:**
1. Create `backend/routers/kpi.py` with `GET /summary`
2. Create `backend/routers/sales.py` with four routes listed above
3. Create `backend/routers/categories.py` with three routes
4. Create `backend/routers/seasonal.py` with four routes
5. Register all routers in `main.py` using `app.include_router()`
6. Test each endpoint via `http://localhost:8000/docs` (FastAPI Swagger UI)

**Relevant Context:**
- Use SQLAlchemy `func.sum()`, `func.count()`, `func.strftime()` for date grouping in SQLite
- Seasonal Index Score = (month_units / annual_average_units) × 100
- All monetary values returned as floats rounded to 2 decimal places

---

### Sub-Task 4 — Frontend: Shared Layout + API Client

**Status:** `[ ] pending`

**Intent:**
Build the navigation shell, shared layout wrapper, and the Axios API client layer before building individual pages. This ensures consistent patterns across all four dashboard pages.

**Expected Outcomes:**
- `App.tsx` renders a persistent sidebar navigation with links to all four pages
- `src/api/client.ts` exports an Axios instance with `baseURL: http://localhost:8000`
- `src/api/` contains typed fetch functions for each endpoint group (kpi, sales, categories, seasonal)
- `src/types/` contains TypeScript interfaces matching every API response shape
- A reusable `KpiCard` component exists in `src/components/`
- A reusable `PageLayout` wrapper component handles consistent padding and page titles

**Todo List:**
1. Create `src/api/client.ts` — Axios instance with base URL
2. Create `src/types/index.ts` — TypeScript interfaces for all API response shapes
3. Create `src/api/kpi.ts`, `sales.ts`, `categories.ts`, `seasonal.ts` — typed fetch functions
4. Build `src/components/KpiCard.tsx` — displays label, value, optional sub-label, optional color accent
5. Build `src/components/PageLayout.tsx` — wraps page content with title heading and consistent padding
6. Update `App.tsx` with `react-router-dom` routes and a sidebar nav (Overview, Medicine Sales, Categories, Seasonal Trends)
7. Style the sidebar with TailwindCSS — dark sidebar, white content area

**Relevant Context:**
- React Router v6 `<BrowserRouter>`, `<Routes>`, `<Route>` pattern
- All chart components will be imported from `recharts`

---

### Sub-Task 5 — Frontend: KPI Overview Page

**Status:** `[ ] pending`

**Intent:**
Build the home/overview dashboard page that shows the most important summary numbers and a 12-month revenue trend line.

**Expected Outcomes:**
- `src/pages/Overview.tsx` renders:
  - Four KPI cards: Total Revenue (YTD), Total Units Sold, Total Medicines, Low Stock Alerts
  - A 12-month revenue line chart (Recharts `LineChart`)
  - An OTC vs. Prescription revenue split donut chart (Recharts `PieChart`)
  - A top-10 medicines bar chart (Recharts `BarChart`)
- All data fetched from `/api/kpi/summary`, `/api/sales/over-time`, `/api/sales/by-type`, `/api/sales/top-medicines`
- Loading and error states handled for each data fetch

**Todo List:**
1. Build `Overview.tsx` with four `KpiCard` components using data from `/api/kpi/summary`
2. Add `LineChart` (Recharts) for monthly revenue from `/api/sales/over-time`
3. Add `PieChart` (Recharts) for OTC vs. Prescription split from `/api/sales/by-type`
4. Add `BarChart` (Recharts) for top 10 medicines from `/api/sales/top-medicines`
5. Add loading spinner placeholders while data fetches
6. Verify page renders correctly in browser at `http://localhost:5173/`

---

### Sub-Task 6 — Frontend: Medicine Sales Page

**Status:** `[ ] pending`

**Intent:**
Build the medicine sales detail page with a searchable, sortable table and revenue-over-time drilldown.

**Expected Outcomes:**
- `src/pages/MedicineSales.tsx` renders:
  - A date range filter (month selector dropdowns for start and end month)
  - A sortable data table: Medicine Name | Category | Units Sold | Revenue | Margin %
  - A bar chart of top 15 medicines by revenue for selected date range
  - OTC vs. Prescription toggle (filter the table)
- All data from `/api/sales/medicines` and `/api/sales/top-medicines`

**Todo List:**
1. Build the date range filter (controlled dropdowns for month/year start and end)
2. Build the sortable table component with columns: name, category, units, revenue, margin
3. Add OTC / Prescription / All toggle buttons above the table
4. Add `BarChart` for top medicines in selected range
5. Wire all filters to re-fetch data from the API with updated query params
6. Verify interactions work end-to-end in the browser

---

### Sub-Task 7 — Frontend: Category Breakdown Page

**Status:** `[ ] pending`

**Intent:**
Build the category analytics page showing revenue share, monthly mix, and growth rates.

**Expected Outcomes:**
- `src/pages/Categories.tsx` renders:
  - A donut chart showing revenue share per category (Recharts `PieChart`)
  - A stacked bar chart showing monthly revenue per category (Recharts `BarChart` with stacking)
  - A growth rate table: Category | This Month Revenue | Last Month Revenue | MoM Growth %
- All data from `/api/categories/revenue-share`, `/api/categories/monthly`, `/api/categories/growth`

**Todo List:**
1. Build donut chart for category revenue share
2. Build stacked bar chart for monthly category breakdown (12 months on x-axis)
3. Build growth rate table with color-coded MoM % (green positive, red negative)
4. Add a category filter chip group to highlight/isolate a single category across all charts
5. Verify page renders correctly in browser

---

### Sub-Task 8 — Frontend: Seasonal Trends Page

**Status:** `[ ] pending`

**Intent:**
Build the seasonal trends page that reveals demand patterns across months and categories.

**Expected Outcomes:**
- `src/pages/SeasonalTrends.tsx` renders:
  - A multi-line chart of monthly units sold per category (one colored line per category)
  - A peak months table: Category | Peak Month | Peak Units | Seasonal Index Score
  - A demand heatmap grid: 52 weeks × 7 days, cell color = units sold intensity (CSS grid, no external lib)
  - A YoY comparison line chart (current year vs previous year revenue by month)
- All data from `/api/seasonal/monthly-trend`, `/api/seasonal/peak-months`, `/api/seasonal/heatmap`, `/api/seasonal/yoy-comparison`

**Todo List:**
1. Build multi-line `LineChart` (Recharts) for category monthly trends — one `<Line>` per category
2. Build peak months summary table with seasonal index score column
3. Build the demand heatmap as a CSS grid — 7 columns (days), ~52 rows (weeks), cell background intensity scales with units sold
4. Build YoY comparison `LineChart` with two lines (2024 vs 2023 based on seed data)
5. Add a category multi-select filter to show/hide individual lines in the trend chart
6. Verify all charts render correctly in browser

---

### Sub-Task 9 — Final Integration + Run Instructions

**Status:** `[ ] pending`

**Intent:**
Verify the full application works end-to-end, confirm all pages load real data, and produce a README with clear local run instructions.

**Expected Outcomes:**
- All four dashboard pages render real data from the seeded SQLite database
- No CORS errors in the browser console
- `README.md` documents exact steps to clone, install, seed, and run the application
- Backend runs on `http://localhost:8000`, frontend on `http://localhost:5173`
- FastAPI Swagger docs accessible at `http://localhost:8000/docs`

**Todo List:**
1. Do a full end-to-end check: start backend, start frontend, visit all four pages
2. Fix any CORS, import, or runtime errors found
3. Write `README.md` with:
   - Prerequisites (Python 3.11+, Node 18+)
   - Backend setup: `pip install -r requirements.txt` → `python seed.py` → `uvicorn main:app --reload`
   - Frontend setup: `npm install` → `npm run dev`
   - URLs: backend `http://localhost:8000`, frontend `http://localhost:5173`, API docs `http://localhost:8000/docs`
4. Confirm `pharmacy.db` is listed in `.gitignore`

---

## Technology Decisions

| Concern | Choice | Reason |
|---|---|---|
| Backend framework | FastAPI | Fast to write, auto Swagger docs, async support |
| ORM | SQLAlchemy (sync) | Well-established, works with SQLite out of the box |
| Database | SQLite | Zero setup, file-based, perfect for local MVP |
| Frontend bundler | Vite | Fast dev server, first-class React + TS support |
| Charts | Recharts | React-native, TypeScript typed, composable |
| Styling | TailwindCSS | Utility-first, no CSS file sprawl |
| HTTP client | Axios | Typed requests, interceptor support if needed |
| Routing | React Router v6 | Industry standard, `<BrowserRouter>` pattern |

---

## Constraints

- No AI/ML features
- No authentication — this is a local development tool
- No Docker — runs directly with Python and Node on localhost
- No external APIs — all data comes from the local SQLite seed
