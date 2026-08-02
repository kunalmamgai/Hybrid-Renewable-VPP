import urllib.request, json

resp = urllib.request.urlopen("http://localhost:8000/health/scheduler")
health = json.loads(resp.read().decode())
print("Scheduler:", json.dumps(health, indent=2))

resp = urllib.request.urlopen("http://localhost:8000/api/v1/digital-twin/campus")
twin = json.loads(resp.read().decode())
print(f"Buildings in DB: {len(twin['buildings'])}")
for b in twin["buildings"]:
    print(f"  {b['building_id']}: SoC={b['battery_soc_pct']:.0f}%")

resp = urllib.request.urlopen("http://localhost:8000/api/v1/decisions?limit=5")
decisions = json.loads(resp.read().decode())
print(f"\nDecisions in DB: {len(decisions)}")
for d in decisions:
    print(f"  [{d['decision_type']}] {d['action'][:70]}")
