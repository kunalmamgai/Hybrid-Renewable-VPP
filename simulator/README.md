# URJA Multi-Campus Energy Digital Twins

A local dashboard of interactive campus energy simulators for Rajasthan institutions,
with the detailed VIT Bhopal twin preserved as an independent reference campus.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Included

- Searchable multi-campus dashboard with independent routes for VIT Bhopal, MNIT
  Jaipur, MBM University, RTU Kota, AIIMS Jodhpur, SMS Medical College, Dr. S.N.
  Medical College, University of Rajasthan, JNVU, MLSU and IIT Jodhpur.
- Distinct data-driven Rajasthan campus reconstructions based on official facilities,
  landmark descriptions and public Google Maps context.
- Every Rajasthan simulator includes live local weather, weather events, lightning,
  occupancy, solar and wind generation, battery/grid behavior, selectable buildings,
  camera presets, animated power flow, traffic and students.
- Detailed main Academic Block, Lab Complex, Academic Block 2, Boys' Hostel,
  six-storey Girls' Hostel precinct, hostel blocks, roads, Zhandu Park, fields, and
  utility infrastructure.
- Independent boys' and girls' mess buildings with dining halls, kitchens, exhaust
  systems, service access, outdoor seating, and separate energy demand.
- Full circular Special Block reconstructed from the supplied photograph, with paid
  campus shops and cafés at ground level, premium girls' rooms above, and a landscaped
  enclosed courtyard.
- Landmark VIT Bhopal main entrance with red gateway towers, bilingual signage,
  guardhouses, ornamental gates, arrival landscaping, and the lion roundabout.
- Outdoor sports complex with a running track, football and cricket field,
  basketball, tennis and volleyball courts, stands and floodlighting.
- Large multipurpose hall with a glazed entrance, event plaza and rooftop energy
  equipment.
- Live weather refreshed every ten minutes with a browser-safe wttr.in feed,
  Open-Meteo backup, request de-duplication, persistent caching, and a resilient
  local model when public services are temporarily unavailable.
- Weather-aware daylight, clouds, rain, wind turbines, solar generation, demand,
  batteries, grid import/export, and animated power flow.
- A live campus activity layer with moving cars, VIT campus buses, more than 125
  animated students distributed across twelve pedestrian routes, circling birds,
  drifting clouds, and aircraft crossing the sky.
- Clear summer, monsoon, thunderstorm, winter morning, and night scenarios.
- Thunderstorm lightning with randomized multi-flash timing, branching visible bolts,
  ground impacts, and brief campus-wide illumination.
- Campus occupancy, battery strategy, renewable proposal, and grid-outage controls.
- Twelve camera locations, selectable assets, and the supplied campus references.
- Mouse-wheel, touch, and dedicated zoom controls with a one-click campus reset.
- Performance-optimized grouped rendering for windows, trees, clouds, roads, parking,
  solar arrays, and landscape detail.

## Accuracy note

This is a visual and operational digital-twin reconstruction, not a survey-grade BIM,
architectural drawing, or electrical design. Existing campus buildings and proposed
energy infrastructure are identified separately in the interface.
