import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


def _get_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _get_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _get_str(name: str, default: str):
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return str(raw)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    database_url: str = _get_str("DATABASE_URL", "sqlite:///./faceid.db")
    environment: str = _get_str("environment", "development")
    sql_echo: bool = _get_bool("SQL_ECHO", False)
    sql_pool_size: int = _get_int("SQL_POOL_SIZE", 10)
    sql_max_overflow: int = _get_int("SQL_MAX_OVERFLOW", 20)
    sql_pool_recycle: int = _get_int("SQL_POOL_RECYCLE", 1800)
    sql_pool_pre_ping: bool = _get_bool("SQL_POOL_PRE_PING", True)

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


settings = Settings()
