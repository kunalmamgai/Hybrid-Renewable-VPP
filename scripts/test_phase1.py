"""Quick integration test for Phase 1 AI modules."""
import asyncio
import sys
from backend.adapters.simulated import SimulatedAdapter, SimulatedConfig, SimulatedBuilding
from backend.services.forecast_engine import ForecastEngine
from backend.services.reliability_guard import ReliabilityGuard
from backend.services.load_advisor import LoadShiftAdvisor
from backend.services.dispatch_optimizer import DispatchOptimizer
from backend.services.battery_scheduler import BatteryChargeScheduler
from backend.services.vnm_optimizer import VnmOptimizer
from backend.services.cost_optimizer import CostOptimizer
from backend.services.carbon_optimizer import CarbonOptimizer
from backend.services.decision_manager import DecisionManager
from backend.ws.websocket_manager import ConnectionManager


async def main():
    config = SimulatedConfig(time_scale=1.0, interval_seconds=300.0, scenario="mvp_day")
    buildings = [
        SimulatedBuilding(building_id="academic_block", name="Academic", criticality_tier="critical",
                          solar_capacity_kw=150, wind_capacity_kw=60, battery_capacity_kwh=300, battery_soc_initial_pct=50),
        SimulatedBuilding(building_id="hostel_block", name="Hostel", criticality_tier="critical",
                          solar_capacity_kw=80, wind_capacity_kw=30, battery_capacity_kwh=150, battery_soc_initial_pct=60),
        SimulatedBuilding(building_id="admin_block", name="Admin", criticality_tier="non_critical",
                          solar_capacity_kw=40, wind_capacity_kw=20, battery_capacity_kwh=100, battery_soc_initial_pct=40),
        SimulatedBuilding(building_id="lab_block", name="Lab", criticality_tier="critical",
                          solar_capacity_kw=60, wind_capacity_kw=25, battery_capacity_kwh=150, battery_soc_initial_pct=45),
    ]
    adapter = SimulatedAdapter(config=config, buildings=buildings)
    twin = await adapter.read_sensors()

    print("=== Phase 1 Integration Test ===\n")

    # Test Forecast Engine
    forecast = await ForecastEngine().forecast(twin)
    n_buildings = len(forecast.solar)
    n_intervals = len(forecast.solar.get("academic_block", type("", (), {"values": []})()).values)
    print(f"1. Forecast Engine: {n_buildings} buildings, {n_intervals} intervals (24h @ 5min)")

    # Test Reliability Guard
    constraints = await ReliabilityGuard().compute_constraints(twin, forecast)
    print(f"2. Reliability Guard: reserve_floor={constraints.reserve_floor_pct}%, "
          f"critical_load={constraints.critical_load_kw:.1f}kW, "
          f"non_critical={constraints.non_critical_load_kw:.1f}kW")

    # Test Load Advisor
    advice = await LoadShiftAdvisor().advise(forecast, "academic_block")
    print(f"3. Load Advisor: {len(advice.windows)} windows, "
          f"best={advice.best_window.recommendation if advice.best_window else 'None'}, "
          f"worst={advice.worst_window.recommendation if advice.worst_window else 'None'}")

    # Test Dispatch Optimizer
    dispatch = await DispatchOptimizer().generate_candidates(twin, forecast, constraints, "academic_block")
    print(f"4. Dispatch Optimizer: {len(dispatch)} strategies: {[d.strategy for d in dispatch]}")

    # Test Battery Scheduler
    battery = await BatteryChargeScheduler().generate_candidates(twin, forecast, constraints, "academic_block")
    print(f"5. Battery Scheduler: {len(battery)} actions: {[b.action for b in battery]}")

    # Test VNM Optimizer
    vnm = await VnmOptimizer().generate_candidates(twin, forecast)
    print(f"6. VNM/GNM Optimizer: {len(vnm)} strategies")

    # Test Cost Engine
    cost = await CostOptimizer().score_candidate(dispatch[0], "academic_block", twin)
    print(f"7. Cost Engine: strategy={dispatch[0].strategy} -> {cost}")

    # Test Carbon Engine
    carbon = await CarbonOptimizer().score_candidate(dispatch[0], "academic_block", twin)
    print(f"8. Carbon Engine: strategy={dispatch[0].strategy} -> {carbon}")

    # Full Decision Manager test
    ws = ConnectionManager()
    dm = DecisionManager(adapter=adapter, ws_manager=ws, cost_weight=0.7, carbon_weight=0.3)
    result = await dm.run_cycle(twin)

    print(f"\n=== Decision Manager Result ===")
    print(f"Cycle: {result['cycle_number']}")
    print(f"Strategies evaluated: {result['strategies_evaluated']}")
    print(f"Decisions made: {len(result['decisions'])}")
    print(f"Reliability: {'EMERGENCY' if result['reliability']['emergency_mode'] else 'NORMAL'}")
    print(f"  Reserve floor: {result['reliability']['reserve_floor_pct']}%")
    print(f"  Shortfall predicted: {result['reliability']['shortfall_predicted_kwh']} kWh")

    for d in result["decisions"]:
        print(f"\n  [{d['decision_type']}] {d['action'][:70]}")
        print(f"    Confidence: {d['confidence_pct']}%")
        print(f"    Savings: INR{d['expected_savings_inr']:.2f} | Carbon: {d['expected_carbon_reduction_kg']:.2f}kg")
        print(f"    Reason: {d['reason'][:120]}")
        print(f"    Alternative: {d['alternative_considered'][:120]}")
        if d["building_id"]:
            print(f"    Building: {d['building_id']} | SoC after: {d['battery_soc_after_pct']}%")

    print("\n=== Phase 1 Test PASSED ===")


if __name__ == "__main__":
    asyncio.run(main())
