"""Full-day synthetic data simulator — generates 5-minute readings for 24 hours.

This is the Phase 0 deliverable: the system must produce believable 5-minute
readings for solar, wind, battery, and demand before any decision loop is built.

Run:  python -m backend.simulator.run_simulation --duration 24h --interval 5min
"""
from __future__ import annotations

import argparse
import asyncio
import logging

from backend.adapters.simulated import (
    SimulatedAdapter,
    SimulatedBuilding,
    SimulatedConfig,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def default_buildings() -> list[SimulatedBuilding]:
    """Standard campus configuration: 4 representative buildings."""
    return [
        SimulatedBuilding(
            building_id="academic_block",
            name="Academic Block A",
            criticality_tier="critical",
            solar_capacity_kw=150.0,
            wind_capacity_kw=60.0,
            battery_capacity_kwh=300.0,
            battery_soc_initial_pct=50.0,
            tariff_inr_per_unit=9.0,
            vnm_sharing_ratio=0.3,
        ),
        SimulatedBuilding(
            building_id="hostel_block",
            name="Girls Hostel",
            criticality_tier="critical",
            solar_capacity_kw=80.0,
            wind_capacity_kw=30.0,
            battery_capacity_kwh=150.0,
            battery_soc_initial_pct=60.0,
            tariff_inr_per_unit=9.0,
            vnm_sharing_ratio=0.4,
        ),
        SimulatedBuilding(
            building_id="admin_block",
            name="Admin Block",
            criticality_tier="non_critical",
            solar_capacity_kw=40.0,
            wind_capacity_kw=20.0,
            battery_capacity_kwh=100.0,
            battery_soc_initial_pct=40.0,
            tariff_inr_per_unit=9.0,
            vnm_sharing_ratio=0.2,
        ),
        SimulatedBuilding(
            building_id="lab_block",
            name="Science Lab Complex",
            criticality_tier="critical",
            solar_capacity_kw=60.0,
            wind_capacity_kw=25.0,
            battery_capacity_kwh=150.0,
            battery_soc_initial_pct=45.0,
            tariff_inr_per_unit=9.0,
            vnm_sharing_ratio=0.15,
        ),
    ]


async def run_simulation(duration_hours: int = 24, interval_minutes: int = 5, scenario: str = "mvp_day"):
    """Run a full simulated day and print key statistics."""
    config = SimulatedConfig(
        time_scale=1.0,  # Fast-forward: all 288 readings generated instantly
        interval_seconds=interval_minutes * 60,
        scenario=scenario,
    )

    adapter = SimulatedAdapter(config=config, buildings=default_buildings())

    readings: list[dict] = []
    stats = {
        "total_solar_kwh": 0.0,
        "total_wind_kwh": 0.0,
        "total_consumption_kwh": 0.0,
        "total_grid_import_kwh": 0.0,
        "total_grid_export_kwh": 0.0,
        "min_soc_pct": 100.0,
        "max_soc_pct": 0.0,
    }

    total_intervals = int((duration_hours * 60) / interval_minutes)
    logger.info(f"Starting {duration_hours}h simulation ({total_intervals} intervals at {interval_minutes}-min resolution, scenario='{scenario}')")

    for step in range(total_intervals):
        result = await adapter.read_sensors()
        readings.append(result)

        # Aggregate stats
        for key, value in result.items():
            if key in adapter.buildings:
                stats["total_solar_kwh"] += value.get("solar_generation_kwh", 0)
                stats["total_wind_kwh"] += value.get("wind_generation_kwh", 0)
                stats["total_consumption_kwh"] += value.get("consumption_kwh", 0)
                stats["total_grid_import_kwh"] += value.get("grid_import_kwh", 0)
                stats["total_grid_export_kwh"] += value.get("grid_export_kwh", 0)
                stats["min_soc_pct"] = min(stats["min_soc_pct"], value.get("battery_soc_pct", 100))
                stats["max_soc_pct"] = max(stats["max_soc_pct"], value.get("battery_soc_pct", 0))

    # Summary
    sim_time_start = readings[0]["timestamp"]
    sim_time_end = readings[-1]["timestamp"]

    logger.info("=" * 80)
    logger.info("SIMULATION COMPLETE — 24-HOUR SUMMARY")
    logger.info("=" * 80)
    logger.info(f"  Time range:       {sim_time_start} → {sim_time_end}")
    logger.info(f"  Intervals:        {len(readings)}")
    logger.info(f"  Buildings:         {len(adapter.buildings)}")
    logger.info("")
    logger.info("  GENERATION")
    logger.info(f"    Total solar:    {stats['total_solar_kwh']:.1f} kWh")
    logger.info(f"    Total wind:     {stats['total_wind_kwh']:.1f} kWh")
    logger.info(f"    Total renewable: {stats['total_solar_kwh'] + stats['total_wind_kwh']:.1f} kWh")
    logger.info("")
    logger.info("  DEMAND & GRID")
    logger.info(f"    Total demand:   {stats['total_consumption_kwh']:.1f} kWh")
    logger.info(f"    Grid import:    {stats['total_grid_import_kwh']:.1f} kWh")
    logger.info(f"    Grid export:    {stats['total_grid_export_kwh']:.1f} kWh")
    logger.info("")
    logger.info("  BATTERY")
    logger.info(f"    Min SoC:        {stats['min_soc_pct']:.1f}%")
    logger.info(f"    Max SoC:        {stats['max_soc_pct']:.1f}%")
    logger.info("")
    logger.info("  COST (at ₹9.00 buy / ₹5.00 sell)")
    cost = stats["total_grid_import_kwh"] * 9.0 - stats["total_grid_export_kwh"] * 5.0
    carbon = stats["total_grid_import_kwh"] * 0.74
    logger.info(f"    Grid cost:      ₹{cost:.2f}")
    logger.info(f"    Carbon:         {carbon:.1f} kg CO₂")
    logger.info(f"    Self-consumption: {(stats['total_solar_kwh'] + stats['total_wind_kwh'] - stats['total_grid_export_kwh']) / max(0.01, stats['total_solar_kwh'] + stats['total_wind_kwh']) * 100:.1f}%")
    logger.info("=" * 80)

    return readings, stats


def main():
    parser = argparse.ArgumentParser(description="Run the VPP synthetic data simulator")
    parser.add_argument("--duration", type=str, default="24h", help="Duration (e.g., 24h, 1h, 0.5h)")
    parser.add_argument("--interval", type=int, default=5, help="Interval in minutes")
    parser.add_argument("--scenario", type=str, default="mvp_day",
                        choices=["mvp_day", "cloudy_still_afternoon", "wind_fills_solar_gap", "shortfall_protects_hostel"])
    args = parser.parse_args()

    # Parse duration
    if args.duration.endswith("h"):
        duration_hours = float(args.duration[:-1])
    else:
        duration_hours = float(args.duration)

    asyncio.run(run_simulation(
        duration_hours=duration_hours,
        interval_minutes=args.interval,
        scenario=args.scenario,
    ))


if __name__ == "__main__":
    main()
