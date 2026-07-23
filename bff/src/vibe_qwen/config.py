"""BFF 設定。各值可經環境變數覆寫，供 Docker Compose 正式版與 dev 版切換。"""

import os
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import TypeVar

T = TypeVar("T")


def _env(name: str, default: str, cast: Callable[[str], T]) -> Callable[[], T]:
    """回傳 default_factory：實例化時讀環境變數並轉型，未設則用 default。"""
    return lambda: cast(os.environ.get(name, default))


def _parse_origins(raw: str) -> list[str]:
    return [o.strip() for o in raw.split(",") if o.strip()]


@dataclass(frozen=True)
class Settings:
    # 嚴格 CORS/Origin 白名單：僅允許前端 Origin，不開放萬用字元。
    allowed_origins: list[str] = field(
        default_factory=_env("VIBE_QWEN_FRONTEND_ORIGINS", "http://localhost:5173", _parse_origins)
    )
    # 暫存資料夾與孤兒檔保留期（秒）；啟動序列據此回收過期檔。
    temp_dir: Path = field(default_factory=_env("VIBE_QWEN_TEMP_DIR", "var/tmp", Path))
    temp_max_age_seconds: float = field(
        default_factory=_env("VIBE_QWEN_TEMP_MAX_AGE_SECONDS", "86400", float)
    )
    # 重量級請求資源護欄：單一請求逾時（秒）與同時處理上限。
    request_timeout_seconds: float = field(
        default_factory=_env("VIBE_QWEN_REQUEST_TIMEOUT_SECONDS", "60", float)
    )
    max_concurrent_heavy_requests: int = field(
        default_factory=_env("VIBE_QWEN_MAX_CONCURRENT_HEAVY_REQUESTS", "8", int)
    )
