from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import datetime
import pandas as pd
import io
from reportlab.lib.pagesizes import mm
from reportlab.lib.units import mm as mm_unit
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# Ancho fijo de impresora térmica: 50mm. El alto se calcula dinámicamente
# según el contenido (None = altura automática/infinita en reportlab).
THERMAL_WIDTH = 50 * mm_unit

load_dotenv()

app = FastAPI(title="MarketSecure API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
    """Reporte avanzado de ventas usando pandas."""
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


@app.get("/api/orders/{order_id}/invoice")
def generate_invoice(order_id: str):
    """
    Genera el recibo de una orden en formato de ticket térmico (50mm de ancho),
    como los que imprimen las cajas registradoras / impresoras POS.
    """
    order_res = supabase.table("orders").select(
        "*, order_items(quantity, unit_price, products(name)), "
        "buyer:profiles!orders_buyer_id_fkey(full_name, email, phone), "
        "seller:profiles!orders_seller_id_fkey(full_name, email, phone, address, city)"
    ).eq("id", order_id).single().execute()

    if not order_res.data:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    order = order_res.data

    payment_res = supabase.table("payments").select("*").eq("order_id", order_id).execute()
    payment = payment_res.data[0] if payment_res.data else None

    buffer = io.BytesIO()
    # Alto generoso (300mm) — reportlab no imprime las páginas vacías sobrantes,
    # pero necesitamos un valor fijo porque SimpleDocTemplate requiere pagesize.
    doc = SimpleDocTemplate(
        buffer,
        pagesize=(THERMAL_WIDTH, 300 * mm_unit),
        topMargin=3 * mm_unit,
        bottomMargin=3 * mm_unit,
        leftMargin=2 * mm_unit,
        rightMargin=2 * mm_unit,
    )

    styles = getSampleStyleSheet()

    center_bold = ParagraphStyle(
        "CenterBold", parent=styles["Normal"], alignment=TA_CENTER,
        fontName="Helvetica-Bold", fontSize=11, leading=13,
    )
    center_small = ParagraphStyle(
        "CenterSmall", parent=styles["Normal"], alignment=TA_CENTER,
        fontSize=7, leading=9, textColor=colors.HexColor("#374151"),
    )
    left_small = ParagraphStyle(
        "LeftSmall", parent=styles["Normal"], alignment=TA_LEFT,
        fontSize=7.5, leading=10,
    )
    divider_style = ParagraphStyle(
        "Divider", parent=styles["Normal"], alignment=TA_CENTER, fontSize=7,
    )

    elements = []

    # Encabezado
    elements.append(Paragraph("MarketSecure", center_bold))
    elements.append(Paragraph("Recibo de Compra", center_small))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("-" * 32, divider_style))

    # Datos de la orden — compactos, una línea cada uno
    elements.append(Paragraph(f"Orden: {order['id'][:8].upper()}", left_small))
    elements.append(Paragraph(f"Fecha: {order['created_at'][:10]}", left_small))
    elements.append(Paragraph(f"Estado: {order['status'].capitalize()}", left_small))
    elements.append(Spacer(1, 3))
    elements.append(Paragraph("-" * 32, divider_style))

    # Vendedor
    seller = order["seller"]
    seller_address = f"{seller.get('address', '')}, {seller.get('city', '')}".strip(", ")
    elements.append(Paragraph(f"<b>{seller['full_name']}</b>", left_small))
    if seller_address and seller_address != ",":
        elements.append(Paragraph(seller_address, left_small))
    if seller.get("phone"):
        elements.append(Paragraph(f"Tel: {seller['phone']}", left_small))
    elements.append(Spacer(1, 3))
    elements.append(Paragraph("-" * 32, divider_style))

    # Comprador
    elements.append(Paragraph(f"Cliente: {order['buyer']['full_name']}", left_small))
    elements.append(Spacer(1, 3))
    elements.append(Paragraph("-" * 32, divider_style))

    # Items — tabla compacta de 2 columnas (nombre+cant / subtotal)
    item_rows = []
    for item in order.get("order_items", []):
        name = item["products"]["name"] if item.get("products") else "Producto"
        qty = item["quantity"]
        price = item["unit_price"]
        subtotal = qty * price
        item_rows.append([Paragraph(f"{name} x{qty}", left_small), Paragraph(f"${subtotal:.2f}", left_small)])

    if item_rows:
        items_table = Table(item_rows, colWidths=[32 * mm_unit, 13 * mm_unit])
        items_table.setStyle(TableStyle([
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 1),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ]))
        elements.append(items_table)

    elements.append(Spacer(1, 4))
    elements.append(Paragraph("-" * 32, divider_style))

    # Total
    total_table = Table(
        [[Paragraph("<b>TOTAL</b>", left_small), Paragraph(f"<b>${order['total_amount']:.2f}</b>", left_small)]],
        colWidths=[32 * mm_unit, 13 * mm_unit],
    )
    total_table.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("-" * 32, divider_style))

    if payment:
        elements.append(Spacer(1, 3))
        elements.append(Paragraph(f"Ref: {payment['stripe_payment_id']}", center_small))

    elements.append(Spacer(1, 8))
    elements.append(Paragraph("¡Gracias por tu compra!", center_bold))
    elements.append(Spacer(1, 2))
    elements.append(Paragraph("MarketSecure", center_small))

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=recibo-{order_id[:8]}.pdf"}
    )