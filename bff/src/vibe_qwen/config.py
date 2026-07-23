"""BFF 設定。各值可經環境變數覆寫，供 Docker Compose 正式版與 dev 版切換。"""

import os
from dataclasses import dataclass, field
from pathlib import Path


def _default_allowed_origins() -> list[str]:
    raw = os.environ.get("VIBE_QWEN_FRONTEND_ORIGINS", "http://localhost:5173")
    return [o.strip() for o in raw.split(",") if o.strip()]


def _default_temp_dir() -> Path:
    return Path(os.environ.get("VIBE_QWEN_TEMP_DIR", "var/tmp"))


def _default_temp_max_age_seconds() -> float:
    return float(os.environ.get("VIBE_QWEN_TEMP_MAX_AGE_SECONDS", "86400"))


def _default_request_timeout_seconds() -> float:
    return float(os.environ.get("VIBE_QWEN_REQUEST_TIMEOUT_SECONDS", "60"))


def _default_max_concurrent_heavy_requests() -> int:
    return int(os.environ.get("VIBE_QWEN_MAX_CONCURRENT_HEAVY_REQUESTS", "8"))


@dataclass(frozen=True)
class Settings:
    # 嚴格 CORS/Origin 白名單：僅允許前端 Origin，不開放萬用字元。
    allowed_origins: list[str] = field(default_factory=_default_allowed_origins)
    # 暫存資料夾與孤兒檔保留期（秒）；啟動序列據此回收過期檔。
    temp_dir: Path = field(default_factory=_default_temp_dir)
    temp_max_age_seconds: float = field(default_factory=_default_temp_max_age_seconds)
    # 重量級請求資源護欄：單一請求逾時（秒）與同時處理上限。
    request_timeout_seconds: float = field(default_factory=_default_request_timeout_seconds)
    max_concurrent_heavy_requests: int = field(
        default_factory=_default_max_concurrent_heavy_requests
    )
