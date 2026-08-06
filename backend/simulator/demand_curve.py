"""Building demand curve — time-of-day and occupancy driven.

Demand profiles vary by building type:
  • Academic blocks: low overnight, peak at noon (HVAC)
  • Hostels: peak at 7-9am, 6-11pm (lighting, water heating)
  • Labs: steady baseline (equipment always on)
  • Admin: 9am-5pm only, low after hours

The curve uses a cosine-modulated sinusoidal model:
  P(t) = P_peak × (0.15 + 0.85 × (1 + cos(π × (t - t_peak) / 12)) / 2) × occupancy
"""
from __future__ import annotations

import math
from datetime import datetime


class DemandCurve:
    """Generates realistic campus building demand based on time-of-day and occupancy."""

    def __init__(self):
        # Building type profiles: (peak_hour, off_peak_factor, base_factor)
        self.profiles = {
            "academic": {"peak_hour": 13, "off_peak": 0.15, "base": 0.30},
            "hostel": {"peak_hour": 20, "off_peak": 0.25, "base": 0.35},
            "lab": {"peak_hour": 11, "off_peak": 0.50, "base": 0.60},
            "admin": {"peak_hour": 11, "off_peak": 0.02, "base": 0.05},
            "sports": {"peak_hour": 16, "off_peak": 0.05, "base": 0.10},
        }
        self.default_profile = {"peak_hour": 12, "off_peak": 0.15, "base": 0.30}

    def demand_curve(
        self,
        dt: datetime,
        peak_kw: float,
        occupancy: float = 1.0,
        building_type: str = "academic",
    ) -> float:
        """Compute demand for a given time.

        Args:
            dt: Current datetime
            peak_kw: Peak demand in kW (at maximum occupancy, midday)
            occupancy: Fraction (0.0 to 1.0) representing building occupancy
            building_type: Type of building for profile selection

        Returns:
            Current demand in kW
        """
        profile = self.profiles.get(building_type, self.default_profile)
        hour = dt.hour + dt.minute / 60.0

        # Cosine-modulated demand: peak at peak_hour, trough at peak_hour + 12
        t_peak = profile["peak_hour"]
        t_offset = (hour - t_peak + 12) % 24 - 12  # -12 to +12
        cos_factor = (1 + math.cos(math.pi * t_offset / 12.0)) / 2.0  # 0 to 1

        # Base + modulations
        demand_factor = profile["off_peak"] + (1.0 - profile["off_peak"]) * cos_factor
        demand_factor = max(profile["base"], demand_factor)

        # Weekend reduction
        if dt.weekday() >= 5:  # Saturday, Sunday
            demand_factor *= 0.6

        # Apply occupancy and weekend factor
        return peak_kw * demand_factor * occupancy
