from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import datetime
import pandas as pd

load_dotenv()  # lee las variables del archivo .env

app = FastAPI(title="MarketSecure API")

# CORS: permite que el frontend de Vite (localhost:5173) llame a este backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # en producción: tu dominio real
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


@app.get("/")
def root():
    return {"status": "ok", "service": "MarketSecure Python API"}


@app.get("/api/seller-report/{seller_id}")
def seller_report(seller_id: str):
    """
    Reporte avanzado de ventas usando pandas — análisis que sería
    tedioso replicar en JavaScript.
    """
    orders_res = supabase.table("orders").select("*").eq("seller_id", seller_id).execute()
    orders = orders_res.data

    if not orders:
        return {"message": "Sin órdenes registradas", "data": []}

    df = pd.DataFrame(orders)
    df["created_at"] = pd.to_datetime(df["created_at"])
    df["month"] = df["created_at"].dt.strftime("%Y-%m")

    monthly_revenue = (
        df[df["status"].isin(["paid", "confirmed", "shipped", "delivered"])]
        .groupby("month")["total_amount"]
        .sum()
        .to_dict()
    )

    total = len(df)
    cancelled = len(df[df["status"] == "cancelled"])
    cancellation_rate = round((cancelled / total) * 100, 2) if total > 0 else 0

    return {
        "total_orders": total,
        "monthly_revenue": monthly_revenue,
        "cancellation_rate": cancellation_rate,
        "generated_at": datetime.now().isoformat(),
    }