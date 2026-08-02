import asyncio
import json
import websockets

async def listen():
    async with websockets.connect("ws://localhost:8000/ws") as ws:
        print("Connected to WebSocket. Listening for messages...")
        for i in range(10):
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=15)
                data = json.loads(msg)
                msg_type = data.get("type", "unknown")
                print(f"\n[{i+1}] Type: {msg_type}")
                if msg_type == "full_cycle":
                    result = data.get("result", {})
                    print(f"  Cycle: {result.get('cycle_number', '?')}")
                    print(f"  Strategies: {result.get('strategies_evaluated', 0)}")
                    decisions = result.get("decisions", [])
                    print(f"  Decisions: {len(decisions)}")
                    for d in decisions[:3]:
                        print(f"    [{d['decision_type']}] {d['action'][:60]}")
                        print(f"      conf={d['confidence_pct']}% savings=INR{d['expected_savings_inr']:.2f}")
                elif msg_type == "twin_update":
                    buildings = data.get("buildings", {})
                    print(f"  Buildings: {list(buildings.keys())}")
                elif msg_type == "health":
                    print(f"  Adapter: {data.get('adapter', {})}")
                    print(f"  Cycles: {data.get('scheduler_cycles', 0)}")
                elif msg_type == "error":
                    print(f"  ERROR: {data.get('message', '')}")
            except asyncio.TimeoutError:
                print(f"\n[{i+1}] Timeout waiting for message")
                continue
        print("\nDone listening.")

asyncio.run(listen())
