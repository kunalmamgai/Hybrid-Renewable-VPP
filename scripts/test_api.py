import urllib.request, json

# Test decisions endpoint
print("=== Recent Decisions ===")
resp = urllib.request.urlopen("http://localhost:8000/api/v1/decisions?limit=5")
decisions = json.loads(resp.read().decode())
for d in decisions:
    print(f"  [{d['decision_type']}] {d['action'][:70]}")
    print(f"    Confidence: {d['confidence_pct']}% | Building: {d['building_id']}")
    print(f"    Reason: {d['reason'][:100]}")
    print(f"    Savings: INR{d['expected_savings_inr']:.2f} | Carbon: {d['expected_carbon_reduction_kg']:.2f}kg")
    print()

# Test decision stats
resp = urllib.request.urlopen("http://localhost:8000/api/v1/decisions/stats")
stats = json.loads(resp.read().decode())
print("=== Decision Stats ===")
print(json.dumps(stats, indent=2))

# Test export stats
resp = urllib.request.urlopen("http://localhost:8000/api/v1/export/stats")
export = json.loads(resp.read().decode())
print("\n=== Export Stats ===")
print(json.dumps(export, indent=2))

# Test CSV export
resp = urllib.request.urlopen("http://localhost:8000/api/v1/export/csv")
csv_content = resp.read().decode()
print(f"\n=== CSV Export (first 5 lines) ===")
for line in csv_content.split("\n")[:5]:
    print(line)

# Test digital twin
resp = urllib.request.urlopen("http://localhost:8000/api/v1/digital-twin/campus")
twin = json.loads(resp.read().decode())
print(f"\n=== Campus State ===")
print(f"Buildings: {len(twin['buildings'])}")
for b in twin["buildings"]:
    print(f"  {b['building_id']}: solar={b['solar_generation_kwh']:.1f}kWh, wind={b['wind_generation_kwh']:.1f}kWh, "
          f"demand={b['consumption_kwh']:.1f}kWh, SoC={b['battery_soc_pct']:.0f}%")
