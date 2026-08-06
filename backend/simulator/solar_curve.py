"""Solar irradiance curve — computes plane-of-array irradiance from time, location, and cloud cover.

Uses a simplified clear-sky model with cosine projection for the sun's angle,
modulated by a cloud-cover factor. This is a heuristic model suitable for
hackathon simulation; production would replace with satellite-based nowcasting.

Formula:
  G_clear = G_sc * cos(θ)  [cosine projection, where θ = zenith angle]
  G_actual = G_clear * (1 - cloud_cover * 0.8)  [cloud attenuation]

Where G_sc = 1000 W/m² (solar constant at sea level)
"""
from __future__ import annotations

import math
from datetime import datetime

DEGREES_TO_RADIANS = math.pi / 180.0


class SolarCurve:
    """Computes solar irradiance and PV generation for a given time and cloud cover."""

    def __init__(self, latitude_deg: float, longitude_deg: float):
        self.latitude = latitude_deg
        self.longitude = longitude_deg

    def solar_declination(self, day_of_year: int) -> float:
        """Approximate solar declination in radians."""
        return 23.45 * DEGREES_TO_RADIANS * math.sin(
            math.radians(360.0 * (284 + day_of_year) / 365.0)
        )

    def zenith_angle(self, dt: datetime) -> float:
        """Solar zenith angle in radians."""
        day_of_year = dt.timetuple().tm_yday
        decl = self.solar_declination(day_of_year)
        hour_angle = math.radians(15.0 * ((dt.hour + dt.minute / 60.0) - 12))
        lat_rad = self.latitude * DEGREES_TO_RADIANS

        cos_theta = (
            math.sin(lat_rad) * math.sin(decl) +
            math.cos(lat_rad) * math.cos(decl) * math.cos(hour_angle)
        )
        return math.acos(max(0, min(1, cos_theta)))  # Clamp to valid range

    def irradiance(self, dt: datetime, cloud_cover: float = 0.0) -> float:
        """Return plane-of-array irradiance in W/m².

        Args:
            dt: Datetime with timezone
            cloud_cover: Fraction (0.0 = clear sky, 1.0 = overcast)

        Returns:
            Irradiance in W/m² (0 during night)
        """
        theta = self.zenith_angle(dt)
        if theta > 90 * DEGREES_TO_RADIANS:
            return 0.0  # Night

        # Clear-sky irradiance (simplified)
        g_sc = 1000.0  # W/m² solar constant at surface
        air_mass = 1.0 / max(0.01, math.cos(theta))
        g_clear = g_sc * math.cos(theta) * (0.85 ** (air_mass ** 0.5))

        # Cloud attenuation (0.8 factor: clouds block 80% of light per unit cover)
        cloud_factor = 1.0 - (cloud_cover * 0.8)
        g_actual = g_clear * cloud_factor

        # Add some natural variability
        variability = 0.05 * math.sin(dt.hour * 0.5)
        return max(0, g_actual * (1 + variability))
