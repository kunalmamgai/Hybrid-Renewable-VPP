"""Application configuration loaded from environment variables."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

INSECURE_DEFAULT_JWT_SECRET = "change-me-before-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_file_encoding="utf-8")

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    environment: str = "development"  # "development" or "production"

    # CORS (comma-separated origin allowlist, e.g. "http://localhost:5173,https://surya.example.com")
    cors_origins: str = ""

    # Authentication
    jwt_secret_key: str = INSECURE_DEFAULT_JWT_SECRET
    jwt_access_token_expire_minutes: int = 1440
    google_client_id: str = ""

    # Rate limiting (auth endpoints, per client IP)
    rate_limit_auth_per_minute: int = 10

    # Database
    database_url: str = "sqlite+aiosqlite:///./vpp.db"

    # Simulator
    simulator_time_scale: float = 60.0
    simulator_default_scenario: str = "mvp_day"

    # Alerts
    alert_battery_low: float = 20.0
    alert_battery_critical: float = 15.0
    alert_grid_import_high: float = 500.0

    # Optimization weights
    cost_weight: float = 0.7
    carbon_weight: float = 0.3

    # Grid
    grid_emission_factor_kg_per_kwh: float = 0.74
    default_tariff_buy_inr: float = 9.0
    default_tariff_sell_inr: float = 5.0

    # Battery
    battery_min_soc_pct: float = 20.0
    battery_max_soc_pct: float = 95.0
    battery_health_threshold_pct: float = 80.0

    # Dispatch intervals
    decision_cycle_seconds: int = 10  # Demo speed: 10s cycle (production: 300s = 5min)

    # Data retention
    decision_retention_days: int = 30

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def jwt_secret_is_insecure(self) -> bool:
        return (
            not self.jwt_secret_key
            or self.jwt_secret_key == INSECURE_DEFAULT_JWT_SECRET
            or len(self.jwt_secret_key) < 32
        )


settings = Settings()
