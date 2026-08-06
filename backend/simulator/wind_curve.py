"""Wind power curve model — converts wind speed to turbine power output.

Uses a piecewise model:
  P(v) = 0                          if v < v_cut_in
  P(v) = P_rated × (v³ - v_ci³)/(v_r³ - v_ci³)  if v_cut_in ≤ v < v_rated
  P(v) = P_rated                    if v_rated ≤ v < v_cut_out
  P(v) = 0                          if v ≥ v_cut_out

Default parameters tuned to Rajasthan's typical wind regime:
  cut_in = 3.5 m/s, rated = 12 m/s, cut_out = 25 m/s

The cubic segment comes from the fact that wind power is proportional to v³.
"""
from __future__ import annotations


class WindCurve:
    """Models a wind turbine's power output as a function of wind speed."""

    def __init__(
        self,
        cut_in: float = 3.5,
        rated: float = 12.0,
        cut_out: float = 25.0,
        rated_power_kw: float = 100.0,
    ):
        self.cut_in = cut_in
        self.rated = rated
        self.cut_out = cut_out
        self.rated_power_kw = rated_power_kw
        self._rated_cubed = rated ** 3
        self._cut_in_cubed = cut_in ** 3

    def power_output(self, wind_speed: float) -> float:
        """Return power output as a fraction of rated power (0.0 to 1.0).

        Args:
            wind_speed: in m/s

        Returns:
            Fraction of rated power (0.0 = no generation, 1.0 = rated power)
        """
        if wind_speed < self.cut_in or wind_speed >= self.cut_out:
            return 0.0

        if wind_speed >= self.rated:
            return 1.0

        # Cubic interpolation between cut-in and rated
        numerator = wind_speed ** 3 - self._cut_in_cubed
        denominator = self._rated_cubed - self._cut_in_cubed
        if denominator == 0:
            return 0.0
        return max(0.0, min(1.0, numerator / denominator))
