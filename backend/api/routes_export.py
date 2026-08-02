"""API routes for CSV/PDF statutory export of cost and carbon savings."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_session
from backend.models.decision_log import DecisionLog
from backend.models.digital_twin import BuildingTwin

router = APIRouter(prefix="/api/v1", tags=["export"])


def generate_csv(building_data: list, decision_data: list) -> str:
    """Generate CSV content from building snapshots and decision logs."""
    import io
    import csv

    output = io.StringIO()
    writer = csv.writer(output)

    # Building snapshot section
    writer.writerow(["# BUILDING SNAPSHOT", datetime.utcnow().isoformat() + "Z"])
    writer.writerow(["building_id", "criticality_tier", "consumption_kwh",
                     "solar_generation_kwh", "wind_generation_kwh", "grid_import_kwh",
                     "grid_export_kwh", "battery_soc_pct"])
    for b in building_data:
        writer.writerow([
            b.get("building_id", ""),
            b.get("criticality_tier", ""),
            b.get("consumption_kwh", 0),
            b.get("solar_generation_kwh", 0),
            b.get("wind_generation_kwh", 0),
            b.get("grid_import_kwh", 0),
            b.get("grid_export_kwh", 0),
            b.get("battery_soc_pct", 0),
        ])

    writer.writerow([])

    # Decision summary section
    writer.writerow(["# DECISION SUMMARY"])
    writer.writerow(["decision_id", "timestamp", "action", "confidence_pct",
                     "expected_savings_inr", "expected_carbon_reduction_kg", "reason"])
    for d in decision_data:
        writer.writerow([
            d.get("decision_id", ""),
            d.get("timestamp", ""),
            d.get("action", ""),
            d.get("confidence_pct", 0),
            d.get("expected_savings_inr", 0),
            d.get("expected_carbon_reduction_kg", 0),
            d.get("reason", ""),
        ])

    return output.getvalue()


def generate_pdf(building_data: list, decision_data: list, stats: dict) -> bytes:
    """Generate a PDF statutory report using reportlab."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors
    from reportlab.lib.colors import HexColor
    import io

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            rightMargin=0.5*inch, leftMargin=0.5*inch,
                            topMargin=0.5*inch, bottomMargin=0.5*inch)
    styles = getSampleStyleSheet()
    elements = []

    # Header
    elements.append(Paragraph("Hybrid Renewable VPP Platform", styles['Title']))
    elements.append(Paragraph("Statutory Report — Cost & Carbon Savings", styles['Heading2']))
    elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%d %B %Y, %H:%M UTC')}", styles['Normal']))
    elements.append(Spacer(1, 0.2*inch))

    # Summary stats
    elements.append(Paragraph("Executive Summary", styles['Heading3']))
    data = [
        ["Total Cost Savings", f"₹{stats.get('total_savings_inr', 0):.2f}"],
        ["Total Carbon Reduction", f"{stats.get('total_carbon_reduction_kg', 0):.1f} kg CO₂"],
        ["Number of Decisions Logged", f"{stats.get('total_decisions', 0)}"],
        ["Grid Emission Factor", "0.74 kg CO₂/kWh (Rajasthan average)"],
    ]
    table = Table(data, colWidths=[3*inch, 2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#e8f5e9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 0.3*inch))

    # Building details
    elements.append(Paragraph("Building Snapshot", styles['Heading3']))
    building_rows = [["Building ID", "Tier", "Consumption", "Solar Gen", "Wind Gen",
                       "Grid Import", "Grid Export", "Battery SoC"]]
    for b in building_data:
        building_rows.append([
            b.get("building_id", ""),
            b.get("criticality_tier", ""),
            f"{b.get('consumption_kwh', 0):.1f}",
            f"{b.get('solar_generation_kwh', 0):.1f}",
            f"{b.get('wind_generation_kwh', 0):.1f}",
            f"{b.get('grid_import_kwh', 0):.1f}",
            f"{b.get('grid_export_kwh', 0):.1f}",
            f"{b.get('battery_soc_pct', 0):.1f}%",
        ])
    btable = Table(building_rows, colWidths=[0.8*inch, 0.7*inch, 0.7*inch, 0.7*inch,
                                               0.7*inch, 0.7*inch, 0.7*inch, 0.6*inch])
    btable.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#e3f2fd')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(btable)
    elements.append(Spacer(1, 0.3*inch))

    # Recent decisions
    elements.append(Paragraph("Recent Decisions", styles['Heading3']))
    decision_rows = [["Time", "Action", "Confidence", "Savings (₹)", "Carbon (kg)", "Reason"]]
    for d in decision_data[:20]:
        decision_rows.append([
            d.get("timestamp", "")[:19],
            d.get("action", ""),
            f"{d.get('confidence_pct', 0):.0f}%",
            f"{d.get('expected_savings_inr', 0):.2f}",
            f"{d.get('expected_carbon_reduction_kg', 0):.2f}",
            d.get("reason", "")[:50],
        ])
    dtable = Table(decision_rows, colWidths=[0.9*inch, 0.8*inch, 0.7*inch, 0.8*inch,
                                              0.7*inch, 2.5*inch])
    dtable.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#fff9c4')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(dtable)

    # Legal footer
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph(
        "Report generated by Hybrid Renewable VPP Platform v1.0.0. "
        "Grounds: RERC Third Amendment Regulations, 2025. "
        "Emission factor: 0.74 kg CO₂/kWh (central_grid average).",
        ParagraphStyle('Footer', fontSize=7, textColor=colors.grey)
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


@router.get("/export/csv")
async def export_csv(session: AsyncSession = Depends(get_session)):
    """Download cost and carbon savings as CSV for statutory reporting."""
    buildings_result = await session.execute(select(BuildingTwin))
    decisions_result = await session.execute(
        select(DecisionLog).order_by(desc(DecisionLog.timestamp)).limit(100)
    )
    building_data = [b.to_dict() for b in buildings_result.scalars().all()]
    decision_data = [d.to_dict() for d in decisions_result.scalars().all()]

    csv_content = generate_csv(building_data, decision_data)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=statutory_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"},
    )


@router.get("/export/pdf")
async def export_pdf(session: AsyncSession = Depends(get_session)):
    """Download statutory report as PDF."""
    buildings_result = await session.execute(select(BuildingTwin))
    decisions_result = await session.execute(
        select(DecisionLog).order_by(desc(DecisionLog.timestamp)).limit(100)
    )
    building_data = [b.to_dict() for b in buildings_result.scalars().all()]
    decision_data = [d.to_dict() for d in decisions_result.scalars().all()]

    total_savings = sum(d.get("expected_savings_inr", 0) for d in decision_data)
    total_carbon = sum(d.get("expected_carbon_reduction_kg", 0) for d in decision_data)
    stats = {
        "total_savings_inr": total_savings,
        "total_carbon_reduction_kg": total_carbon,
        "total_decisions": len(decision_data),
    }

    pdf_content = generate_pdf(building_data, decision_data, stats)
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=statutory_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"},
    )


@router.get("/export/stats")
async def export_stats(session: AsyncSession = Depends(get_session)):
    """Return exportable statistics summary."""
    buildings_result = await session.execute(select(BuildingTwin))
    decisions_result = await session.execute(select(DecisionLog))
    buildings = buildings_result.scalars().all()
    decisions = decisions_result.scalars().all()

    total_grid_import = sum(b.grid_import_kwh or 0 for b in buildings)
    total_grid_export = sum(b.grid_export_kwh or 0 for b in buildings)
    total_solar = sum(b.solar_generation_kwh or 0 for b in buildings)
    total_wind = sum(b.wind_generation_kwh or 0 for b in buildings)
    total_savings = sum(d.expected_savings_inr or 0 for d in decisions)
    total_carbon = sum(d.expected_carbon_reduction_kg or 0 for d in decisions)

    return {
        "period": "lifetime (all logged data)",
        "total_solar_generation_kwh": round(total_solar, 2),
        "total_wind_generation_kwh": round(total_wind, 2),
        "total_grid_import_kwh": round(total_grid_import, 2),
        "total_grid_export_kwh": round(total_grid_export, 2),
        "total_cost_savings_inr": round(total_savings, 2),
        "total_carbon_reduction_kg": round(total_carbon, 2),
        "renewable_self_consumption_pct": round(
            (total_solar + total_wind - total_grid_export) / max(0.01, total_solar + total_wind) * 100, 1
        ) if (total_solar + total_wind) > 0 else 0,
    }
