import asyncio
from backend.adapters.simulated import SimulatedAdapter, SimulatedConfig, SimulatedBuilding
from backend.services.decision_manager import DecisionManager
from backend.ws.websocket_manager import ConnectionManager

async def test():
    config = SimulatedConfig(time_scale=1.0, interval_seconds=300.0, scenario="mvp_day")
    buildings = [
        SimulatedBuilding(building_id="academic_block", name="Academic", criticality_tier="critical",
                          solar_capacity_kw=150, wind_capacity_kw=60, battery_capacity_kwh=300, battery_soc_initial_pct=30),
        SimulatedBuilding(building_id="admin_block", name="Admin", criticality_tier="non_critical",
                          solar_capacity_kw=40, wind_capacity_kw=20, battery_capacity_kwh=100, battery_soc_initial_pct=20),
    ]
    adapter = SimulatedAdapter(config=config, buildings=buildings)

    for _ in range(100):
        await adapter.read_sensors()

    twin = await adapter.read_sensors()
    ts = twin["timestamp"]
    ac_solar = twin["academic_block"]["solar_generation_kwh"]
    ac_demand = twin["academic_block"]["consumption_kwh"]
    print(f"Time: {ts}")
    print(f"Academic: solar={ac_solar:.2f}, demand={ac_demand:.2f}, SoC=30%")

    ws = ConnectionManager()
    dm = DecisionManager(adapter=adapter, ws_manager=ws)
    result = await dm.run_cycle(twin)

    print(f"\nStrategies evaluated: {result['strategies_evaluated']}")
    print(f"Decisions: {len(result['decisions'])}")
    for d in result['decisions']:
        print(f"  [{d['decision_type']}] {d['action'][:80]}")
        print(f"    conf={d['confidence_pct']}% savings=INR{d['expected_savings_inr']:.2f}")

    if result['decisions']:
        d = result['decisions'][0]
        print(f"\nDecision dict keys: {list(d.keys())}")
        print(f"context type: {type(d.get('context'))}")
        if 'context' in d:
            print(f"context keys: {list(d['context'].keys())}")

asyncio.run(test())
