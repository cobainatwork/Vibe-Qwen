"""BFF 應用工廠。模型呼叫一律經注入的 AsrClient/TtsClient adapter。"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from vibe_qwen.adapters.base import AsrClient, TtsClient
from vibe_qwen.adapters.stub import StubAsrClient, StubTtsClient
from vibe_qwen.api.health import router as health_router
from vibe_qwen.config import Settings
from vibe_qwen.files.cleanup import cleanup_expired_temp_files
from vibe_qwen.middleware.limits import HeavyRequestGuard, HeavyRequestRejected
from vibe_qwen.middleware.origin import OriginGuardMiddleware


def create_app(
    asr_client: AsrClient | None = None,
    tts_client: TtsClient | None = None,
    settings: Settings | None = None,
) -> FastAPI:
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        cleanup_expired_temp_files(settings.temp_dir, settings.temp_max_age_seconds)
        yield

    app = FastAPI(title="Vibe-Qwen BFF", lifespan=lifespan)
    app.state.settings = settings
    app.state.asr_client = asr_client or StubAsrClient()
    app.state.tts_client = tts_client or StubTtsClient()
    app.state.heavy_guard = HeavyRequestGuard(
        max_concurrent=settings.max_concurrent_heavy_requests,
        timeout_seconds=settings.request_timeout_seconds,
    )

    async def _on_heavy_rejected(request, exc: HeavyRequestRejected) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )

    app.add_exception_handler(HeavyRequestRejected, _on_heavy_rejected)

    app.add_middleware(OriginGuardMiddleware, allowed_origins=settings.allowed_origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,  # 顯式清單，不用萬用字元 *
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health_router)
    return app
