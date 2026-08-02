"""Digital Twin SQLAlchemy models — the authoritative state of the campus."""
from __future__ import annotations

from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class BuildingTwin(Base):
    __tablename__ = "building_twins"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    criticality_tier = Column(String, nullable=False, default="non_critical")

    # Generation (kWh this reading interval)
    solar_generation_kwh = Column(Float, default=0.0)
    wind_generation_kwh = Column(Float, default=0.0)

    # Energy flows (kWh this reading interval)
    consumption_kwh = Column(Float, default=0.0)
    grid_import_kwh = Column(Float, default=0.0)
    grid_export_kwh = Column(Float, default=0.0)
    net_meter_units = Column(Float, default=0.0)

    # Battery
    battery_soc_pct = Column(Float, default=50.0)
    battery_health_pct = Column(Float, default=96.0)

    # Tariff
    tariff_inr_per_unit = Column(Float, default=9.0)

    # Forecast (24h)
    predicted_solar_tomorrow_kwh = Column(Float, default=0.0)
    predicted_wind_tomorrow_kwh = Column(Float, default=0.0)
    predicted_demand_tomorrow_kwh = Column(Float, default=0.0)

    last_updated = Column(DateTime, default=func.now(), onupdate=func.now())

    turbines = relationship("WindTurbineTwin", back_populates="building", cascade="all, delete-orphan")
    batteries = relationship("BatteryTwin", back_populates="building", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "building_id": self.id,
            "name": self.name,
            "criticality_tier": self.criticality_tier,
            "solar_generation_kwh": round(self.solar_generation_kwh, 2),
            "wind_generation_kwh": round(self.wind_generation_kwh, 2),
            "consumption_kwh": round(self.consumption_kwh, 2),
            "battery_soc_pct": round(self.battery_soc_pct, 1),
            "battery_health_pct": round(self.battery_health_pct, 1),
            "grid_import_kwh": round(self.grid_import_kwh, 2),
            "grid_export_kwh": round(self.grid_export_kwh, 2),
            "net_meter_units": round(self.net_meter_units, 2),
            "tariff_inr_per_unit": self.tariff_inr_per_unit,
            "predicted_solar_tomorrow_kwh": round(self.predicted_solar_tomorrow_kwh, 2),
            "predicted_wind_tomorrow_kwh": round(self.predicted_wind_tomorrow_kwh, 2),
            "predicted_demand_tomorrow_kwh": round(self.predicted_demand_tomorrow_kwh, 2),
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
        }


class WindTurbineTwin(Base):
    __tablename__ = "wind_turbine_twins"

    id = Column(String, primary_key=True, index=True)
    building_id = Column(String, ForeignKey("building_twins.id"), nullable=False)

    wind_speed_mps = Column(Float, default=0.0)
    wind_direction_deg = Column(Float, default=0.0)
    power_output_kw = Column(Float, default=0.0)
    cut_in_speed_mps = Column(Float, default=3.5)
    rated_speed_mps = Column(Float, default=12.0)
    cut_out_speed_mps = Column(Float, default=25.0)
    rated_power_kw = Column(Float, default=100.0)
    status = Column(String, default="idle")

    building = relationship("BuildingTwin", back_populates="turbines")

    def to_dict(self) -> dict:
        return {
            "turbine_id": self.id,
            "building_id": self.building_id,
            "wind_speed_mps": round(self.wind_speed_mps, 2),
            "wind_direction_deg": round(self.wind_direction_deg, 1),
            "power_output_kw": round(self.power_output_kw, 2),
            "cut_in_speed_mps": self.cut_in_speed_mps,
            "rated_speed_mps": self.rated_speed_mps,
            "cut_out_speed_mps": self.cut_out_speed_mps,
            "rated_power_kw": self.rated_power_kw,
            "status": self.status,
        }


class BatteryTwin(Base):
    __tablename__ = "battery_twins"

    id = Column(String, primary_key=True, index=True)
    building_id = Column(String, ForeignKey("building_twins.id"), nullable=False)

    soc_pct = Column(Float, default=50.0)
    health_pct = Column(Float, default=96.0)
    capacity_kwh = Column(Float, default=200.0)
    charge_rate_max_kw = Column(Float, default=50.0)
    discharge_rate_max_kw = Column(Float, default=50.0)
    temperature_c = Column(Float, default=25.0)
    voltage_v = Column(Float, default=48.0)
    current_a = Column(Float, default=0.0)
    power_kw = Column(Float, default=0.0)

    building = relationship("BuildingTwin", back_populates="batteries")

    def to_dict(self) -> dict:
        return {
            "battery_id": self.id,
            "building_id": self.building_id,
            "soc_pct": round(self.soc_pct, 1),
            "health_pct": round(self.health_pct, 1),
            "capacity_kwh": self.capacity_kwh,
            "charge_rate_max_kw": self.charge_rate_max_kw,
            "discharge_rate_max_kw": self.discharge_rate_max_kw,
            "temperature_c": round(self.temperature_c, 1),
            "voltage_v": round(self.voltage_v, 2),
            "current_a": round(self.current_a, 2),
            "power_kw": round(self.power_kw, 2),
        }
