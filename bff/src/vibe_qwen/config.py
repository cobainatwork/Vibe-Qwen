"""BFF 設定。各值可經環境變數覆寫，供 Docker Compose 正式/dev 兩版切換。"""

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


@dataclass(frozen=True)
class Settings:
    # 嚴格 CORS/Origin 白名單：僅允許前端 Origin，不開放萬用字元。
    allowed_origins: list[str] = field(default_factory=_default_allowed_origins)
    # 暫存資料夾與孤兒檔保留期（秒）；啟動序列據此回收過期檔。
    temp_dir: Path = field(default_factory=_default_temp_dir)
    temp_max_age_seconds: float = field(default_factory=_default_temp_max_age_seconds)
