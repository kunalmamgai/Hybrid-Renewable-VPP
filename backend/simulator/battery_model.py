"""Battery charge/discharge model with SoC dynamics and loss modelling.

SoC update equation:
  SOC_new = SOC_old + (P_charge - P_discharge - P_loss) × Δt / E_capacity

Where:
  P_loss = loss_factor × (P_charge + P_discharge)
  Typical loss_factor = 0.02 (2% round-trip loss)

Battery health degrades slowly over cycles.
State transitions: charging → holding → discharging → emergency_shed
"""
from __future__ import annotations


class BatteryModel:
    """Simulates a lithium-ion battery bank with SoC dynamics, health degradation, and thermal effects."""

    CHARGE_EFFICIENCY = 0.98
    DISCHARGE_EFFICIENCY = 0.98
    LOSS_FACTOR = 0.02  # 2% of charge/discharge power lost as heat
    HEALTH_DEGRADE_PER_CYCLE = 0.001  # 0.1% per full cycle (0→100→0)
    TEMP_RISE_PER_KW = 0.5  # °C rise per kW of power flow
    TEMP_COOLING_RATE = 0.3  # °C per minute cooling

    def __init__(
        self,
        capacity_kwh: float = 200.0,
        initial_soc_pct: float = 50.0,
        charge_rate_max_kw: float = 50.0,
        discharge_rate_max_kw: float = 50.0,
    ):
        self.capacity_kwh = capacity_kwh
        self.soc_pct = initial_soc_pct
        self.health_pct = 100.0
        self.charge_rate_max_kw = charge_rate_max_kw
        self.discharge_rate_max_kw = discharge_rate_max_kw
        self.temperature_c = 25.0
        self.power_kw = 0.0  # Net power flow (positive = charging, negative = discharging)
        self.voltage_v = 48.0
        self.current_a = 0.0
        self._total_charged_kwh = 0.0
        self._total_discharged_kwh = 0.0

    def charge(self, power_kw: float, interval_seconds: float = 300.0) -> float:
        """Charge the battery at the given power for one interval.

        Returns:
            Actual energy charged in kWh (after losses).
        """
        power_kw = min(power_kw, self.charge_rate_max_kw)
        power_kw = min(power_kw, self._available_charge_power())

        # Apply efficiency
        effective_power = power_kw * self.CHARGE_EFFICIENCY
        energy_kwh = effective_power * (interval_seconds / 3600.0)

        # SoC update
        soc_delta = (energy_kwh / self.capacity_kwh) * 100.0
        self.soc_pct = min(100.0, self.soc_pct + soc_delta)

        # Losses as heat
        self._apply_temperature(power_kw, interval_seconds)

        # Health degradation
        self._degrade_health(energy_kwh)

        self._total_charged_kwh += energy_kwh
        self.power_kw = power_kw
        self._update_electrical_params(power_kw)
        return energy_kwh

    def discharge(self, power_kw: float, interval_seconds: float = 300.0) -> float:
        """Discharge the battery at the given power for one interval.

        Returns:
            Actual energy discharged in kWh (after losses).
        """
        power_kw = min(power_kw, self.discharge_rate_max_kw)
        available_energy = self.soc_pct / 100.0 * self.capacity_kwh
        max_discharge = available_energy * self.DISCHARGE_EFFICIENCY
        max_power = max_discharge / (interval_seconds / 3600.0)
        power_kw = min(power_kw, max_power)
        power_kw = max(0, power_kw)

        if power_kw <= 0:
            self.power_kw = 0
            self._update_electrical_params(0)
            return 0.0

        effective_power = power_kw * self.DISCHARGE_EFFICIENCY
        energy_kwh = effective_power * (interval_seconds / 3600.0)

        soc_delta = (energy_kwh / self.capacity_kwh) * 100.0
        self.soc_pct = max(0.0, self.soc_pct - soc_delta)

        self._apply_temperature(-power_kw, interval_seconds)
        self._degrade_health(energy_kwh)

        self._total_discharged_kwh += energy_kwh
        self.power_kw = -power_kw
        self._update_electrical_params(-power_kw)
        return energy_kwh

    def available_power_kw(self) -> float:
        """Return the maximum power the battery can currently deliver (kW)."""
        available_energy = (self.soc_pct / 100.0) * self.capacity_kwh
        # Can't discharge more than 50% in one 5-min interval
        max_discharge_energy = min(available_energy * 0.5, available_energy)
        interval_hours = 300.0 / 3600.0
        return max_discharge_energy / interval_hours

    def _available_charge_power(self) -> float:
        """Return the maximum power the battery can currently accept (kW)."""
        available_capacity = (100.0 - self.soc_pct) / 100.0 * self.capacity_kwh
        max_charge_energy = min(available_capacity * 0.5, available_capacity)
        return max_charge_energy / (300.0 / 3600.0)

    def _apply_temperature(self, power_kw: float, interval_seconds: float) -> None:
        heat_from_loss = abs(power_kw) * self.LOSS_FACTOR
        temp_rise = heat_from_loss * self.TEMP_RISE_PER_KW * (interval_seconds / 3600.0)
        temp_drop = self.TEMP_COOLING_RATE * (interval_seconds / 3600.0) * (
            max(0, self.temperature_c - 25.0) / 25.0
        )
        self.temperature_c = max(
            0.0,
            min(60.0, self.temperature_c * 0.95 + temp_rise - temp_drop)
        )

    def _degrade_health(self, energy_kwh: float) -> None:
        """Degrade battery health based on energy throughput."""
        cycle_fraction = energy_kwh / self.capacity_kwh
        self.health_pct = max(70.0, self.health_pct - cycle_fraction * self.HEALTH_DEGRADE_PER_CYCLE * 100)

    def _update_electrical_params(self, power_kw: float) -> None:
        """Update voltage and current based on power flow."""
        voltage_nominal = 48.0
        soc_factor = 0.9 + 0.2 * (self.soc_pct / 100.0)  # Voltage increases with SoC
        health_factor = self.health_pct / 100.0
        self.voltage_v = voltage_nominal * soc_factor * health_factor
        self.current_a = power_kw / max(0.01, self.voltage_v) * 1000.0 if power_kw != 0 else 0.0
