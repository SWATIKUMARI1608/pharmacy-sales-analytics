from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import kpi, sales, categories, seasonal

app = FastAPI(title="Pharmacy Sales Analytics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kpi.router)
app.include_router(sales.router)
app.include_router(categories.router)
app.include_router(seasonal.router)


@app.get("/")
def health_check():
    return {"status": "ok", "message": "Pharmacy Analytics API is running"}
